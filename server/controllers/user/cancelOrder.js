// controllers/orderController.js
import Order from "../../models/order.js";
import Product from "../../models/products.js";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";

const storage = multer.memoryStorage();

export const uploadRefundFile = multer({ storage: storage });

export const replacementImagesUpload = multer({ 
    storage: storage,
    limits: { 
        files: 20,
    }
}).any();



export const cancelOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason, refundMethod, accountName, accountNumber } = req.body;

        // Validate input
        if (!reason || !reason.trim()) {
            return res.status(400).json({ 
                success: false, 
                message: "Cancellation reason is required" 
            });
        }

        // Find the order
        const order = await Order.findById(id);

        if (!order) {
            return res.status(404).json({ 
                success: false, 
                message: "Order not found" 
            });
        }

        // Check if order is already cancelled
        if (order.cancellation.isCancelled) {
            return res.status(400).json({ 
                success: false, 
                message: "Order is already cancelled" 
            });
        }

        // Only allow cancellation if status is "pending"
        if (order.statusDelivery.toLowerCase() !== "pending") {
            return res.status(400).json({ 
                success: false, 
                message: "Cannot cancel order. Order is already being processed or delivered." 
            });
        }

        // Determine if refund is eligible
        // COD = false, Cashless (GCash, Card, etc.) = true
        const isRefundEligible = order.paymentType.toLowerCase() !== 'cash on delivery';
        
        // Validate refund details if eligible
        if (isRefundEligible) {
            if (!refundMethod || !accountName || !accountNumber) {
                return res.status(400).json({ 
                    success: false, 
                    message: "Refund details (method, account name, and account number) are required for non-COD orders" 
                });
            }

            // Validate refund method
            if (!['GCash', 'Maya'].includes(refundMethod)) {
                return res.status(400).json({ 
                    success: false, 
                    message: "Invalid refund method. Must be GCash or Maya" 
                });
            }

            // Validate account number (should be 10 digits)
            if (!/^\d{10}$/.test(accountNumber)) {
                return res.status(400).json({ 
                    success: false, 
                    message: "Invalid account number. Must be 10 digits" 
                });
            }
        }
        
        // Calculate refund amount (kung eligible)
        const refundAmount = isRefundEligible ? order.totalPrice : 0;
        
        // Upload QR code to Cloudinary instead of saving locally
        let qrCodeUrl = null;
        
        if (req.file) {
            try {
                const base64QR = req.file.buffer.toString('base64');
                const dataURIQR = `data:${req.file.mimetype};base64,${base64QR}`;
                
                const qrResult = await cloudinary.uploader.upload(dataURIQR, {
                    folder: 'refund-qrcodes'
                });
                qrCodeUrl = qrResult.secure_url;
            } catch (uploadError) {
                return res.status(400).json({ message: "Failed to upload QR code to Cloudinary!" });
            }
        }

        // Update cancellation details
        order.cancellation = {
            isCancelled: true,
            reason: reason.trim(),
            cancelledBy: "user",
            cancelledAt: new Date(),
            refund: {
                isEligible: isRefundEligible,
                amount: refundAmount,
                method: isRefundEligible ? refundMethod : undefined,
                accountName: isRefundEligible ? accountName.trim() : undefined,
                accountNumber: isRefundEligible ? accountNumber : undefined,
                qrCode: qrCodeUrl || undefined, // Store Cloudinary URL
                status: isRefundEligible ? "pending" : "not_applicable",
                processedAt: null,
                processedBy: null,
            }
        };

        // Update order status
        if (isRefundEligible) {
            // Non-COD: Set to cancelled first, then add refund processing
            order.statusDelivery = "refund requested";
            
            // Add cancelled status to history
            order.statusHistory.push({
                status: "cancelled",
                description: `Order cancelled by buyer. Reason: ${reason.trim()}`,
                location: "unknown"
            });
            
            // Add refund processing status to history
            order.statusHistory.push({
                status: "refund requested",
                description: `Refund request submitted (${refundMethod} - +63${accountNumber}). Awaiting admin approval.`,
                location: "unknown"
            });
        } else {
            // COD: Simple cancellation
            order.statusDelivery = "cancelled";
            
            // Add cancelled status to history
            order.statusHistory.push({
                status: "cancelled",
                description: `Order cancelled by buyer. Reason: ${reason.trim()}`,
                location: "unknown"
            });
        }

        // Restore product stocks - increment back the quantities
        for (const item of order.orderItems) {
            const prodId = item.prodId;
            const quantity = item.quantity;

            await Product.findByIdAndUpdate(
                prodId,
                { $inc: { stocks: quantity } }
            );
        }

        // Save the order
        await order.save();

        // Return success response
        const successMessage = isRefundEligible
            ? "Order cancelled successfully. Your refund request has been submitted and will be processed by our team."
            : "Order cancelled successfully.";

        res.status(200).json({
            success: true,
            message: successMessage,
            data: {
                orderId: order._id,
                refundStatus: order.cancellation.refund.status,
                refundAmount: refundAmount
            }
        });

    } catch (error) {
        console.error("Cancel order error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to cancel order. Please try again later.",
            error: error.message
        });
    }
};




export const requestReplacement = async (req, res) => {
    try {
        const { orderId, replacementItems } = req.body;
        const userId = req.account.id;

        // Validate required fields
        if (!orderId || !replacementItems) {
            return res.status(400).json({ 
                success: false,
                message: "Order ID and replacement items are required" 
            });
        }

        // Parse replacementItems if it's a string
        const items = typeof replacementItems === 'string' 
            ? JSON.parse(replacementItems) 
            : replacementItems;

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ 
                success: false,
                message: "At least one item must be selected for replacement" 
            });
        }

        // Find order
        const order = await Order.findById(orderId);
        
        if (!order) {
            return res.status(404).json({ 
                success: false,
                message: "Order not found" 
            });
        }

        // Check if order belongs to user
        if (order.userId.toString() !== userId) {
            return res.status(403).json({ 
                success: false,
                message: "Unauthorized access to this order" 
            });
        }

        // Check if order is delivered
        if (order.statusDelivery !== "delivered") {
            return res.status(400).json({ 
                success: false,
                message: "Replacement can only be requested for delivered orders" 
            });
        }

        // Check 24-hour window
        const deliveredStatus = order.statusHistory.find(
            status => status.status === "delivered"
        );

        if (!deliveredStatus) {
            return res.status(400).json({ 
                success: false,
                message: "Delivery timestamp not found" 
            });
        }

        const currentYear = new Date().getFullYear();
        const dateString = `${deliveredStatus.date} ${currentYear} ${deliveredStatus.timestamp}`;
        const deliveredDate = new Date(dateString);
        
        if (isNaN(deliveredDate.getTime())) {
            return res.status(400).json({ 
                success: false,
                message: "Invalid delivery date format" 
            });
        }

        const now = new Date();
        const hoursPassed = (now - deliveredDate) / (1000 * 60 * 60);

        if (hoursPassed > 24) {
            return res.status(400).json({ 
                success: false,
                message: "Replacement request window has expired (24 hours from delivery)" 
            });
        }

        // Process each item
        const processedItems = [];
        const errors = [];

        for (const requestItem of items) {
            const { itemId, reason, description } = requestItem;

            // Validate item data
            if (!itemId || !reason || !reason.trim()) {
                errors.push(`Item ${itemId || 'unknown'}: Missing required fields`);
                continue;
            }

            // Find the specific item in orderItems
            const orderItem = order.orderItems.id(itemId);
            
            if (!orderItem) {
                errors.push(`Item not found: ${itemId}`);
                continue;
            }

            // Check if already requested
            if (orderItem.replacement?.isRequested) {
                errors.push(`${orderItem.prodName}: Replacement already requested`);
                continue;
            }

            // ✅ CHANGE: Upload replacement images to Cloudinary
            const itemImages = [];
            
            if (req.files) {
                const fieldsForItem = req.files.filter(file => file.fieldname === `replacement_images_${itemId}`);
                
                for (const file of fieldsForItem) {
                    try {
                        const base64Image = file.buffer.toString('base64');
                        const dataURIImage = `data:${file.mimetype};base64,${base64Image}`;
                        
                        const imageResult = await cloudinary.uploader.upload(dataURIImage, {
                            folder: `replacement-images/${orderId}/${itemId}`
                        });
                        itemImages.push(imageResult.secure_url); // ✅ Store Cloudinary URL
                    } catch (uploadError) {
                        errors.push(`${orderItem.prodName}: Failed to upload image to Cloudinary`);
                        continue;
                    }
                }
            }
                
            // Update item with replacement request
            orderItem.replacement = {
                isRequested: true,
                reason: reason.trim(),
                description: description?.trim() || "",
                images: itemImages, // ✅ Store Cloudinary URLs
                requestedAt: new Date(),
                status: "pending"
            };

            processedItems.push({
                itemId: orderItem._id,
                prodName: orderItem.prodName,
                status: "pending"
            });
        }

        // If no items were processed successfully
        if (processedItems.length === 0) {
            return res.status(400).json({ 
                success: false,
                message: "No items could be processed for replacement",
                errors: errors
            });
        }

        // Update main order status
        order.statusDelivery = "replacement requested";

        // Add to main statusHistory
        order.statusHistory.push({
            status: "replacement requested",
            description: `buyer requested replacement`,
            location: "buyer",
            date: new Date().toLocaleDateString("en-PH", {
                month: "short",
                day: "numeric"
            }),
            timestamp: new Date().toLocaleTimeString("en-PH", {
                timeZone: "Asia/Manila",
                hour: "2-digit",
                minute: "2-digit",
                hour12: true
            })
        });
        
        await order.save();

        const response = {
            success: true,
            message: `Replacement request submitted successfully.`,
            data: {
                orderId: order._id,
                processedItems: processedItems,
                totalRequested: processedItems.length
            }
        };

        if (errors.length > 0) {
            response.partialSuccess = true;
            response.errors = errors;
        }

        return res.status(200).json(response);

    } catch (error) {
        console.error("Request replacement error:", error);
        return res.status(500).json({ 
            success: false,
            message: "Failed to process replacement request",
            error: error.message 
        });
    }
};