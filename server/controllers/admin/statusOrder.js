import Order from "../../models/order.js";
import Seller from "../../models/seller.js";
import Product from "../../models/products.js";
import ActivityLog from "../../models/activityLogs.js";
import Admin from "../../models/admin.js";
import multer from "multer";
import PayoutTransaction from "../../models/payoutTransaction.js";
import AdminPaymentTransaction from "../../models/adminPaymentTrans.js";
import SellerPaymentTransaction from "../../models/sellerPaymentTrans.js";
import Notification from "../../models/notification.js";
import DamageLog from "../../models/damageLog.js";
import { v2 as cloudinary } from "cloudinary";
import SalesList from "../../models/salesReport.js";
import Rider from "../../models/rider.js";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);


// ============================================================
// EMAIL - ORDER STATUS NOTIFICATION
// ============================================================
const STATUS_CONFIG = {
    "confirm": {
        label: "Order Confirmed",
        emoji: "✅",
        color: "#28a745",
        bgColor: "#d4edda",
        borderColor: "#28a745",
        message: "Great news! Your order has been confirmed and is now being reviewed for processing.",
    },
    "packing": {
        label: "Order is Being Packed",
        emoji: "📦",
        color: "#17a2b8",
        bgColor: "#d1ecf1",
        borderColor: "#17a2b8",
        message: "Your order is currently being packed and prepared with care.",
    },
    "ready for pick up": {
        label: "Ready for Pick Up",
        emoji: "🏪",
        color: "#fd7e14",
        bgColor: "#ffecd2",
        borderColor: "#fd7e14",
        message: "Your order is packed and ready for pick up at our location. Please bring your order reference number.",
    },
    "ready to deliver": {
        label: "Out for Delivery",
        emoji: "🚀",
        color: "#007bff",
        bgColor: "#cce5ff",
        borderColor: "#007bff",
        message: "Your order is on its way! Our rider will deliver it to your address shortly.",
    },
    "completed": {
        label: "Order Completed",
        emoji: "🎉",
        color: "#28a745",
        bgColor: "#d4edda",
        borderColor: "#28a745",
        message: "Your order has been completed successfully. Thank you for shopping with E-Farmers Hub!",
    },
    "cancelled": {
        label: "Order Cancelled",
        emoji: "❌",
        color: "#dc3545",
        bgColor: "#f8d7da",
        borderColor: "#dc3545",
        message: "Your order has been cancelled. If you have any concerns, please contact our support team.",
    },
    "replacement confirmed": {
        label: "Replacement Approved",
        emoji: "🔄",
        color: "#28a745",
        bgColor: "#d4edda",
        borderColor: "#28a745",
        message: "Your replacement request has been approved. We will prepare and deliver your replacement items.",
    },
    "replacement rejected": {
        label: "Replacement Rejected",
        emoji: "⚠️",
        color: "#dc3545",
        bgColor: "#f8d7da",
        borderColor: "#dc3545",
        message: "Your replacement request has been reviewed and rejected. Please see the details below.",
    },
};

const sendOrderStatusEmail = async (
    email,
    firstname,
    orderId,
    newStatus,
    extraNote = null,
    orderItems = [],
    totalPrice = null
) => {
    try {
        const config = STATUS_CONFIG[newStatus] ?? {
            label: newStatus,
            emoji: "📋",
            color: "#6c757d",
            bgColor: "#e2e3e5",
            borderColor: "#6c757d",
            message: `Your order status has been updated to: ${newStatus}.`,
        };

        const name = firstname.charAt(0).toUpperCase() + firstname.slice(1).toLowerCase();
        const orderIdShort = orderId ?? "N/A";

        const itemsHTML = orderItems.length > 0 ? `
            <table width="100%" cellpadding="0" cellspacing="0" style="margin: 20px 0 0 0; border-collapse: collapse;">
                <tr>
                    <th align="center" style="text-align: center; padding: 10px 12px; background-color: #f8f9fa; color: #333; font-size: 13px; border-bottom: 2px solid #dee2e6;">Product</th>
                    <th align="center" style="text-align: center; padding: 10px 12px; background-color: #f8f9fa; color: #333; font-size: 13px; border-bottom: 2px solid #dee2e6;">Qty</th>
                    <th align="center" style="text-align: center; padding: 10px 12px; background-color: #f8f9fa; color: #333; font-size: 13px; border-bottom: 2px solid #dee2e6;">Price</th>
                </tr>
                ${orderItems.map((item, i) => `
                <tr style="background-color: ${i % 2 === 0 ? '#ffffff' : '#fafafa'};">
                    <td align="center" style="padding: 10px 12px; font-size: 14px; color: #444; text-align: center; border-bottom: 1px solid #f0f0f0;">${item.prodName}</td>
                    <td align="center" style="padding: 10px 12px; font-size: 14px; color: #444; text-align: center; border-bottom: 1px solid #f0f0f0;">${item.quantity} bundle${item.quantity > 1 ? 's' : ''}</td>
                    <td align="center" style="padding: 10px 12px; font-size: 14px; color: #444; text-align: center; border-bottom: 1px solid #f0f0f0;">₱${(item.prodPrice * item.quantity).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
                </tr>
                `).join('')}
            </table>
            ${totalPrice ? `
            <table width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 20px 0; border-collapse: collapse; border-top: 2px solid #dee2e6;">
                <tr>
                    <td style="padding: 12px 12px 12px 0; font-size: 15px; font-weight: 700; color: #333; text-align: left;">Order Total</td>
                    <td style="padding: 12px 0 12px 12px; font-size: 18px; font-weight: 700; color: #28a745; text-align: right;">₱${totalPrice.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
                </tr>
            </table>
            ` : ''}
        ` : '';

        const extraNoteHTML = extraNote ? `
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px; margin: 20px 0;">
                <tr>
                    <td style="padding: 14px 16px;">
                        <p style="color: #856404; font-size: 14px; margin: 0; line-height: 1.5;">
                            📝 <strong>Note:</strong> ${extraNote}
                        </p>
                    </td>
                </tr>
            </table>
        ` : '';

        const { data, error } = await resend.emails.send({
            from: 'E-Farmers Hub <orders@efarmershub.com>',
            to: [email],
            subject: `${config.emoji} ${config.label} - Order #${orderIdShort} | E-Farmers Hub`,
            html: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${config.label} - E-Farmers Hub</title>
    <style>
        body { margin: 0; padding: 0; background-color: #f4f4f4; }
        .email-wrapper { width: 100%; background-color: #f4f4f4; padding: 20px 0; }
        .email-container { width: 100% !important; max-width: 600px !important; margin: 0 auto !important; background-color: #ffffff; border-radius: 10px; overflow: hidden; }
        .email-container td { text-align: center !important; }
        p, h1, h2, h3 { text-align: center !important; }
        @media only screen and (max-width: 620px) {
            .email-container { width: 100% !important; max-width: 100% !important; border-radius: 0 !important; }
            .email-body-td { padding: 20px 16px 10px 16px !important; }
            .email-badge-td { padding: 0 16px !important; }
            h1 { font-size: 22px !important; }
            h2 { font-size: 18px !important; }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
    <table width="100%" cellpadding="0" cellspacing="0" class="email-wrapper">
        <tr>
            <td align="center" valign="top">
                <table cellpadding="0" cellspacing="0" class="email-container" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">

                    <!-- Header with Logo -->
                    <tr>
                        <td align="center" style="padding: 40px 20px; text-align: center !important;">
                            <img src="https://res.cloudinary.com/dtelqtkzj/image/upload/v1770440242/image-removebg-preview_sfsot1.png" alt="E-Farmers Hub Logo" style="display: block; margin: 0 auto 15px auto; max-width: 150px; height: auto;" />
                            <h1 style="color: #28a745; margin: 0; font-size: 28px; font-weight: 600; text-align: center !important;">E-Farmers Hub</h1>
                        </td>
                    </tr>

                    <!-- Status Badge -->
                    <tr>
                        <td align="center" class="email-badge-td" style="padding: 0 30px; text-align: center !important;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="background-color: ${config.bgColor}; border: 2px solid ${config.borderColor}; border-radius: 8px; padding: 20px; text-align: center !important;">
                                        <p style="margin: 0 0 6px 0; font-size: 32px; text-align: center !important;">${config.emoji}</p>
                                        <h2 style="color: ${config.color}; margin: 0; font-size: 22px; font-weight: 700; text-align: center !important;">${config.label}</h2>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Body Content -->
                    <tr>
                        <td align="center" class="email-body-td" style="padding: 30px 30px 10px 30px; text-align: center !important;">
                            <p style="color: #333333; font-size: 16px; margin: 0 0 8px 0; text-align: center !important;">Hi <strong>${name}</strong>,</p>
                            <p style="color: #666666; font-size: 15px; line-height: 1.7; margin: 0 0 20px 0; text-align: center !important;">${config.message}</p>

                            <!-- Order ID Box -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border-radius: 6px; margin-bottom: 20px;">
                                <tr>
                                    <td align="center" style="padding: 14px 18px; text-align: center !important;">
                                        <p style="margin: 0 0 4px 0; font-size: 13px; color: #6c757d; text-transform: uppercase; letter-spacing: 1px; text-align: center !important;">Order Reference</p>
                                        <p style="margin: 0; font-size: 18px; font-weight: 700; color: #333; font-family: 'Courier New', monospace; text-align: center !important;">#${orderIdShort}</p>
                                    </td>
                                </tr>
                            </table>

                            ${itemsHTML}
                            ${extraNoteHTML}

                            <p style="color: #888888; font-size: 13px; line-height: 1.6; margin: 20px 0 10px 0; text-align: center !important;">
                                If you have any questions or concerns about your order, feel free to reach out to our support team.
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td align="center" style="background-color: #f8f9fa; padding: 20px; text-align: center !important; border-top: 1px solid #e9ecef;">
                            <p style="color: #6c757d; font-size: 12px; margin: 0 0 4px 0; text-align: center !important;">
                                © 2026 E-Farmers Hub. All rights reserved.
                            </p>
                            <p style="color: #adb5bd; font-size: 11px; margin: 0; text-align: center !important;">
                                This is an automated notification. Please do not reply to this email.
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
            `
        });

        if (error) {
            console.error('Resend error (order status email):', error);
            return { success: false, error };
        }

        console.log(`Order status email sent [${newStatus}] →`, email);
        return { success: true, data };

    } catch (error) {
        console.error('sendOrderStatusEmail error:', error);
        return { success: false, error };
    }
};


// ============================================================
// EXISTING HELPERS (unchanged)
// ============================================================

const sendSMS = async (contact, orderId, firstname, productList, totalAmount) => {
    const id = orderId.toString().slice(0, 12);
    const seller = firstname.charAt(0).toUpperCase() + firstname.slice(1).toLowerCase();
    const amount = totalAmount.toLocaleString('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

    const message = `Hello Seller ${seller}!, You have new order #${id}, Please prepare: ${productList}, With Total amount of Php${amount}. IMPORTANT REMINDER: Please ensure all products are fresh and good quality. Do not pack spoiled or damaged items.`;

    const submitData = {
        "api_token": process.env.SMS_TOKEN,
        "phone_number": contact,
        "message": message,
    }
    
    try {
        const res = await fetch(process.env.IPROG_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(submitData)
        })
        const data = await res.json();
        if(!res.ok) throw new Error(data.message);
        console.log(data);
    } catch (error) {
        console.log("Error: ", error.message);
    }
}

const formatTime = () =>
    new Date().toLocaleTimeString("en-PH", {
      timeZone: "Asia/Manila",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

const createActivityLog = async (adminId, action, description, req) => {
    try {
        const admin = await Admin.findById(adminId);
        if (!admin) {
            console.error('Admin not found for activity log');
            return;
        }

        const ipAddress = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
                         req.ip || 
                         req.connection?.remoteAddress;
        const userAgent = req.get('user-agent');

        await ActivityLog.create({
            performedBy: adminId,
            adminType: admin.adminType,
            action: action,
            description: description,
            ipAddress: ipAddress,
            userAgent: userAgent,
            status: 'success'
        });
    } catch (error) {
        console.error('Failed to create activity log:', error);
    }
};

const createTransaction = async(items, payment, userId, firstname, lastname, email, totalPrice, refNo, proofOfPayment) => {
    for (const item of items){
        const sellerId = item.seller.id;
        const amount = item.prodPrice * item.quantity;

        await SellerPaymentTransaction.create({
            sellerId: sellerId,
            accountId: userId,
            accountName: `${firstname} ${lastname}`,
            accountEmail: email,
            type: "customer payment",
            paymentMethod: payment,
            totalAmount: amount,
            status: "paid",
            paidAt: { 
                date: new Date().toISOString().split("T")[0],
                time: new Date().toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", hour12: true })
            },
            refNo: refNo,
        })
    }

    await AdminPaymentTransaction.create({
        accountId: userId,
        accountName: `${firstname} ${lastname}`,
        accountEmail: email,
        type: "customer payment",
        paymentMethod: payment,
        totalAmount: totalPrice,
        status: "paid",
        paidAt: { 
            date: new Date().toISOString().split("T")[0],
            time: new Date().toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", hour12: true })
        },
        refNo: refNo,
        imageFile: proofOfPayment,
    }) 
}

const createOrUpdatePayout = async(items, order)=>{
    const SELLER_TAX_RATE = process.env.SELLER_TAX_RATE;

    for (const item of items) {
        const sellerId = item.seller.id;
        const grossAmount = item.prodPrice * item.quantity;
        const taxAmount = grossAmount * SELLER_TAX_RATE;
        const netAmount = grossAmount - taxAmount;
        
        const today = new Date().toISOString().split("T")[0];
        const payout = await PayoutTransaction.findOne({ sellerId, date: today, status: "pending"})

        if (payout){
            payout.orders.push({ orderId: order._id, amount: grossAmount })
            payout.totalAmount += grossAmount;
            payout.taxAmount += taxAmount;
            payout.netAmount += netAmount;
            await payout.save();
        } else {
            const seller = await Seller.findOne({_id: sellerId});
            if(!seller) throw new Error("Seller not found. Product must have an active seller.");

            await PayoutTransaction.create({
                sellerId,
                sellerName: `${seller.firstname} ${seller.lastname}`,
                sellerEmail: seller.email,
                e_WalletAcc: { 
                    type: seller?.e_WalletAcc?.type,
                    number: seller?.e_WalletAcc?.number
                },
                date: today,
                orders: [{ orderId: order._id, amount: grossAmount }],
                totalAmount: grossAmount,
                taxAmount: taxAmount,
                netAmount: netAmount
            });
        }
    }
}


// ============================================================
// STATUS ORDER
// ============================================================
export const statusOrder = async(req, res) => {
    try {
        const {orderId, newStatus, assignRider} = req.body;
        const adminId = req.account.id;

        const order = await Order.findById(orderId);

        if(!order) {
            return res.status(404).json({ message: "Order not found" });
        }
        
        const orderIdShort = order.orderId || orderId.toString().slice(-8);


        // ============================
        // CONFIRM / PACKING
        // ============================
        if(newStatus === "confirm" || newStatus === "packing") {
            const descriptionMess = newStatus === "confirm"
                ? "order confirmed, waiting for process."
                : "your order is now process.";

            order.statusDelivery = newStatus;
            order.statusHistory.push({
                status: newStatus,
                description: descriptionMess,
                location: "unknown",
                timestamp: formatTime()
            });

            if(newStatus === "confirm") {

                if(order.paymentType === "gcash" || order.paymentType === "maya") {
                    await createOrUpdatePayout(order.orderItems, order);
                    
                    await createTransaction(
                        order.orderItems, 
                        order.paymentType, 
                        order.userId, 
                        order.firstname, 
                        order.lastname, 
                        order.email, 
                        order.totalPrice, 
                        order.refNo,
                        order.proofOfPayment.image,
                    );

                    try {
                        for (const item of order.orderItems) {
                            const product = await Product.findById(item.prodId);
                            
                            let newSaleId;
                            const lastSale = await SalesList.findOne().sort({ saleId: -1 });
                            
                            if (lastSale && lastSale.saleId) {
                                const lastNumber = parseInt(lastSale.saleId.substring(1));
                                const newNumber = lastNumber + 1;
                                newSaleId = 'S' + String(newNumber).padStart(4, '0');
                            } else {
                                newSaleId = 'S0001';
                            }
                            
                            const salesRecord = new SalesList({
                                saleId: newSaleId,
                                orderId: order._id,
                                customerName: `${order.firstname} ${order.lastname}`,
                                productId: product?._id,
                                category: product?.category || "Uncategorized",
                                quantity: item.quantity,
                                price: item.prodPrice,
                                totalAmount: item.prodPrice * item.quantity,
                                paymentMethod: order.paymentType.toLowerCase(),
                                status: "paid",
                                saleDate: new Date()
                            });  

                            await salesRecord.save();
                        }
                    } catch (salesError) {
                        return res.status(500).json({ message: "Error creating sales list" });
                    }
                }

                // GROUP ITEMS BY SELLER & SEND SMS
                const sellerGroups = {};
                
                for(const item of order.orderItems) {
                    const sellerId = item.seller.id;
                    
                    if(!sellerGroups[sellerId]) {
                        sellerGroups[sellerId] = {
                            sellerName: item.seller.name,
                            items: [],
                            totalAmount: 0
                        };
                    }
                    
                    sellerGroups[sellerId].items.push({
                        prodName: item.prodName,
                        quantity: item.quantity,
                        price: item.prodPrice
                    });
                    
                    sellerGroups[sellerId].totalAmount += (item.prodPrice * item.quantity);
                }
                
                for(const sellerId in sellerGroups) {
                    const seller = await Seller.findById(sellerId);
                    if(!seller) {
                        console.log(`Seller ${sellerId} not found`);
                        continue;
                    }
                    
                    const sellerContact = seller.e_WalletAcc?.number;
                    const { items, totalAmount } = sellerGroups[sellerId];
                    
                    const productList = items.map(item => 
                        `${item.prodName} (${item.quantity} bundle${item.quantity > 1 ? 's' : ''})`
                    ).join(', ');
                    
                    // await sendSMS(sellerContact, order.orderId, seller.firstname, productList, totalAmount);
                }

                // 📧 EMAIL - confirm (with items + total)
                await sendOrderStatusEmail(
                    order.email,
                    order.firstname,
                    order.orderId,
                    "confirm",
                    null,
                    order.orderItems,
                    order.totalPrice
                );

            } else {
                // 📧 EMAIL - packing
                await sendOrderStatusEmail(
                    order.email,
                    order.firstname,
                    order.orderId,
                    "packing"
                );
            }

            await order.save();
            
            const actionDesc = newStatus === "confirm" 
                ? `Confirmed order #${orderIdShort} and notified ${order.orderItems.length} seller(s) via SMS`
                : `Updated order #${orderIdShort} status to packing`;

            await createActivityLog(adminId, 'UPDATE ORDER STATUS', actionDesc, req);
        }
        

        // ============================
        // READY FOR PICK UP / COMPLETED
        // ============================
        if((order.orderMethod === "pick up" && newStatus === "ready for pick up") || newStatus === "completed") {
            const descriptionMess = newStatus === "ready for pick up"
                ? "your order is packed and ready for pick up"
                : "order picked up successfully.";

            order.statusDelivery = newStatus;
            order.statusHistory.push({
                status: newStatus,
                description: descriptionMess,
                location: "unknown",
                timestamp: formatTime()
            });
            await order.save();

            // 📧 EMAIL - ready for pick up / completed
            await sendOrderStatusEmail(
                order.email,
                order.firstname,
                order.orderId,
                newStatus
            );

            const actionDesc = newStatus === "ready for pick up"
                ? `Marked order #${orderIdShort} as ready for pick up`
                : `Completed order #${orderIdShort} - Customer picked up`;

            await createActivityLog(adminId, 'UPDATE ORDER STATUS', actionDesc, req);
        }


        // ============================
        // READY TO DELIVER
        // ============================
        if(order.orderMethod === "delivery" && newStatus === "ready to deliver") {
            order.statusDelivery = newStatus;
            order.statusHistory.push({
                status: newStatus,
                description: "your order is packed and ready to deliver",
                location: "unknown",
                timestamp: formatTime()
            });
            order.riderId = assignRider?.id;
            order.riderName = assignRider?.name;
            await order.save();

            await createActivityLog(
                adminId,
                'ASSIGN RIDER TO ORDER',
                `Assigned rider ${assignRider?.name} to order #${orderIdShort} for delivery`,
                req
            );
            
            const rider = await Rider.findById(assignRider?.id);

            if(rider?.pushToken) {
                const response = await fetch('https://exp.host/--/api/v2/push/send', {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        to: rider.pushToken,
                        sound: 'default',
                        title: '🚀 New Delivery Assigned!',
                        body: `Order #${orderIdShort} is ready to deliver.`,
                        data: { orderId: order._id.toString() }
                    })
                });
                const data = await response.json();
                console.log('Expo push response:', data);
            }

            io.emit('to rider', { message: `new order ${orderIdShort} assigned` });

            // 📧 EMAIL - ready to deliver (with rider name as note)
            await sendOrderStatusEmail(
                order.email,
                order.firstname,
                order.orderId,
                "ready to deliver",
                `Your rider is ${assignRider?.name}.`
            );
        }

        res.status(200).json({ message: `update your status as ${newStatus}`});
    } catch (error) {
        console.error('Status order error:', error);
        res.status(500).json({ message: error.message});
    }
}


const storage = multer.memoryStorage();
export const cancelOrderFile = multer({ storage: storage });


// ============================================================
// CANCEL ORDER
// ============================================================
export const cancelOrder = async (req, res) => {
    try {
        const { orderId, reason, newStatus } = req.body;
        const adminId = req.account.id;

        if (!orderId || !reason || !reason.trim()) {
            return res.status(400).json({ message: "Order ID and reason are required" });
        }

        const order = await Order.findById(orderId);
        
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        const orderIdShort = order.orderId || orderId.toString().slice(-8);

        let proofImageUrl = null;
        
        if (req.file) {
            try {
                const base64Proof = req.file.buffer.toString('base64');
                const dataURIProof = `data:${req.file.mimetype};base64,${base64Proof}`;
                
                const proofResult = await cloudinary.uploader.upload(dataURIProof, {
                    folder: 'order-cancellations/proofs'
                });
                proofImageUrl = proofResult.secure_url;
            } catch (uploadError) {
                return res.status(400).json({ message: "Failed to upload proof image to Cloudinary!" });
            }
        }

        order.statusDelivery = newStatus;
        order.statusHistory.push({
            status: newStatus,
            description: `Order cancelled by admin. Reason: ${reason}`,
            location: "Admin Office",
            imageFile: proofImageUrl,
            timestamp: formatTime()
        });

        let restoredProducts = 0;
        for (const prod of order.orderItems) {
            const prodId = prod.prodId;
            const quantity = prod.quantity;
            await Product.findByIdAndUpdate(prodId, { $inc: { stocks: quantity } });
            restoredProducts++;
        }

        await order.save();

        // 📧 EMAIL - cancelled (with reason as note)
        await sendOrderStatusEmail(
            order.email,
            order.firstname,
            order.orderId,
            "cancelled",
            reason
        );

        const proofText = proofImageUrl ? ' with proof attached' : '';
        await createActivityLog(
            adminId,
            'CANCEL ORDER',
            `Cancelled order #${orderIdShort}${proofText}. Reason: ${reason.substring(0, 50)}${reason.length > 50 ? '...' : ''}. Restored ${restoredProducts} product stock(s)`,
            req
        );

        return res.status(200).json({ message: "Order cancelled successfully" });

    } catch (error) {
        console.error("Cancel order error:", error);
        return res.status(500).json({ message: error.message });
    }
};


// ============================================================
// NOTIFICATION HELPER (unchanged)
// ============================================================
const createNotification = async(senderId, senderRole, recipientId, recipientRole, message, link, type, meta) => {
    await Notification.create({
        sender: { id: senderId, role: senderRole },
        recipient: { id: recipientId, role: recipientRole },
        message: message,
        link: link,
        type: type,
        meta: meta
    }); 
}

const sendReplacementSMS = async (contact, firstname, orderId, productList, faultAssignedTo) => {
    const id = orderId.toString().slice(0, 12);
    const seller = firstname.charAt(0).toUpperCase() + firstname.slice(1).toLowerCase();
    
    let message = "";
    
    if (faultAssignedTo === "rider") {
        message = `E-FARMERS HUB: Hello Seller ${seller}! Replacement needed for Order #${id}: ${productList}. Please prepare the replacement. Thank you!`;
    } else if (faultAssignedTo === "seller") {
        message = `E-FARMERS HUB: Hello Seller ${seller}! Replacement approved for Order #${id}: ${productList}. Delivery Charge: ₱30 (deducted from payout). Please prepare the replacement. Thank you!`;
    }

    const submitData = {
        "api_token": process.env.SMS_TOKEN,
        "phone_number": contact,
        "message": message
    }

    try {
        const res = await fetch(process.env.IPROG_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(submitData)
        })
        const data = await res.json();
        if(!res.ok) throw new Error(data.message);
    } catch (error) {
        console.log("Error: ", error.message);
    }
}


// ============================================================
// REVIEW REPLACEMENT
// ============================================================
export const reviewReplacement = async (req, res) => {
    try {
        const { orderId, reviewItems } = req.body;
        const adminId = req.account.id;

        const order = await Order.findById(orderId);
        
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        const admin = await Admin.findById(adminId);
        const adminName = admin ? `${admin.firstname} ${admin.lastname}` : "Admin";

        let approvedCount = 0;
        let rejectedCount = 0;

        const buyerId = order.userId;
        const orderIdShort = order.orderId || orderId.toString().slice(-8);

        for (const reviewItem of reviewItems) {
            const { itemId, decision, faultAssignedTo, faultDetails, notes } = reviewItem;

            const item = order.orderItems.find(i => i._id.toString() === itemId);

            if (!item) continue;
            if (!item.replacement || !item.replacement.isRequested) continue;

            item.replacement.status = decision === "approve" ? "approved" : "rejected";
            item.replacement.reviewedAt = new Date();
            item.replacement.reviewedBy = adminId;
            item.replacement.notes = notes || "";

            if (decision === "approve") {
                item.replacement.fault = {
                    assignedTo: faultAssignedTo || "none",
                    details: faultDetails || ""
                };

                approvedCount++;

                const product = await Product.findById(item.prodId);

                if (!product) {
                    return res.status(404).json({ 
                        message: `Product "${item.prodName}" not found in system`,
                        itemId: itemId
                    });
                }

                if (product.stocks < item.quantity) {
                    return res.status(400).json({ 
                        message: `Insufficient stock for "${item.prodName}". Available: ${product.stocks}, Needed: ${item.quantity}. Please reject this replacement request.`,
                        itemId: itemId,
                        availableStock: product.stocks,
                        neededQuantity: item.quantity
                    });
                }

                if (faultAssignedTo === "seller") {
                    const sellerId = item.seller.id;
                    const today = new Date().toISOString().split("T")[0];

                    const payout = await PayoutTransaction.findOne({ 
                        sellerId, 
                        date: today, 
                        status: "pending" 
                    });

                    if (payout) {
                        payout.totalAmount -= 30;
                        await payout.save();
                    }
                }

                if (faultAssignedTo === "rider") {
                    const riderId = order.riderId;
                    
                    if (riderId) {
                        const damageValue = item.prodPrice * item.quantity;
                        const riderLiability = damageValue * 0.30;
                        
                        await DamageLog.create({
                            rider: riderId,
                            order: order.orderId,
                            itemDamaged: `${item.prodName}(${item.pid}) (Qty: ${item.quantity > 1 ? `${item.quantity} bundles` : `${item.quantity} bundle`})`,
                            damageValue: damageValue,
                            riderLiability: riderLiability,
                            status: 'pending',
                            notes: faultDetails || `Replacement approved due to rider fault`
                        });
                    }
                }

                await createNotification(
                    adminId, "admin", buyerId, "user",
                    `Your replacement request for "${item.prodName}" has been approved. Your replacement will be prepared for delivery.`,
                    'orderdetails', "replacement approved",
                    { orderId, orderIdShort, itemId: item._id, itemName: item.prodName, faultAssignedTo }
                );
                io.emit('user notif');

            } else {
                rejectedCount++;

                const refundAmount = item.prodPrice * item.quantity;

                if (faultAssignedTo === "seller") {
                    const sellerId = item.seller.id;
                    const today = new Date().toISOString().split("T")[0];

                    const payout = await PayoutTransaction.findOne({ 
                        sellerId, 
                        date: today, 
                        status: "pending" 
                    });

                    if (payout) {
                        payout.totalAmount -= refundAmount;
                        await payout.save();
                    }

                    order.refundHistory.push({
                        itemId: item._id,
                        itemName: item.prodName,
                        pid: item.pid,
                        amount: refundAmount,
                        reason: `Product issue by seller - Replacement unavailable (out of stock)`,
                        triggerEvent: "replacement_rejected",
                        faultParty: faultAssignedTo,
                        requestedAt: new Date(),
                        notes: faultDetails || notes || ''
                    });
                }

                if (faultAssignedTo === "rider") {
                    const riderId = order.riderId;
                    
                    if (riderId) {
                        const riderLiability = refundAmount * 0.30;
                        
                        await DamageLog.create({
                            rider: riderId,
                            order: order.orderId,
                            itemDamaged: `${item.prodName}(${item.pid}) (Qty: ${item.quantity > 1 ? `${item.quantity} bundles` : `${item.quantity} bundle`})`,
                            damageValue: refundAmount,
                            riderLiability: riderLiability,
                            status: 'pending',
                            notes: faultDetails || `Replacement rejected - out of stock`
                        });
                        
                        order.refundHistory.push({
                            itemId: item._id,
                            itemName: item.prodName,
                            pid: item.pid,
                            amount: refundAmount,
                            reason: `Product damaged by ${faultAssignedTo} - Replacement unavailable (out of stock)`,
                            triggerEvent: "replacement_rejected",
                            faultParty: faultAssignedTo,
                            riderLiability: riderLiability,
                            requestedAt: new Date(),
                            notes: faultDetails || notes || ''
                        });
                    }
                }

                await createNotification(
                    adminId, "admin", buyerId, "user",
                    `Your replacement request for "${item.prodName}" has been rejected.${notes ? ` Reason: ${notes}` : ''} A refund of ₱${refundAmount.toFixed(2)} is being processed.`,
                    `orderdetails`, "replacement rejected",
                    { orderId, orderIdShort, itemId: item._id, itemName: item.prodName, reason: notes || "", refundAmount }
                );
                io.emit('user notif');
            }
        }

        // GROUP BY SELLER AND SEND SMS
        const sellerReplacementGroups = {};

        for (const reviewItem of reviewItems) {
            const { itemId, decision, faultAssignedTo } = reviewItem;
            const item = order.orderItems.find(i => i._id.toString() === itemId);
            
            if (!item || decision !== "approve") continue;
            
            const sellerId = item.seller.id;
            
            if (!sellerReplacementGroups[sellerId]) {
                sellerReplacementGroups[sellerId] = {
                    sellerName: item.seller.name,
                    items: [],
                    faultAssignedTo: faultAssignedTo
                };
            }
            
            sellerReplacementGroups[sellerId].items.push({
                prodName: item.prodName,
                quantity: item.quantity
            });
        }

        for (const sellerId in sellerReplacementGroups) {
            const seller = await Seller.findById(sellerId);
            if (!seller) {
                console.log(`Seller ${sellerId} not found`);
                continue;
            }
            
            const sellerContact = seller.e_WalletAcc?.number;
            const { items, faultAssignedTo } = sellerReplacementGroups[sellerId];
            
            const productList = items.map(item => 
                `${item.prodName} (${item.quantity} bundle${item.quantity > 1 ? 's' : ''})`
            ).join(', ');

            await sendReplacementSMS(
                sellerContact, 
                seller.firstname, 
                order.orderId, 
                productList,
                faultAssignedTo
            );
        }

        // CHECK IF ALL REVIEWED
        const allItemsReviewed = order.orderItems.every(item => {
            if (!item.replacement?.isRequested) return true;
            return item.replacement.status === "approved" || item.replacement.status === "rejected";
        });

        const hasApprovedItem = order.orderItems.some(item => 
            item.replacement?.isRequested && item.replacement.status === "approved"
        );

        if (allItemsReviewed) {
            if (hasApprovedItem) {
                order.statusDelivery = "replacement confirmed";

                let statusDescription = "";
                if (rejectedCount > 0) {
                    statusDescription = `${approvedCount} replacement ${approvedCount === 1 ? 'request' : 'requests'} approved. ${rejectedCount} ${rejectedCount === 1 ? 'item was' : 'items were'} rejected for being unreasonable. Please wait for your replacement product${approvedCount > 1 ? 's' : ''}.`;
                } else {
                    statusDescription = `${approvedCount} replacement ${approvedCount === 1 ? 'request' : 'requests'} approved by admin.`;
                }

                order.statusHistory.push({
                    status: "replacement confirmed",
                    description: statusDescription,
                    location: "Admin Office",
                    date: new Date().toLocaleDateString("en-PH", { month: "short", day: "numeric" }),
                    timestamp: new Date().toLocaleTimeString("en-PH", { timeZone: "Asia/Manila", hour: "2-digit", minute: "2-digit", hour12: true }),
                    performedBy: { id: adminId, role: "Admin", name: adminName }
                });

                // 📧 EMAIL - replacement confirmed
                await sendOrderStatusEmail(
                    order.email,
                    order.firstname,
                    order.orderId,
                    "replacement confirmed"
                );

            } else {
                order.statusDelivery = "replacement rejected";

                const rejectedItem = order.orderItems.find(item => 
                    item.replacement?.isRequested && item.replacement.status === "rejected"
                );
                const rejectionReason = rejectedItem?.replacement?.notes || "Request deemed unreasonable";

                order.statusHistory.push({
                    status: "replacement rejected",
                    description: `We have rejected your replacement ${rejectedCount === 1 ? 'request' : 'requests'} (${rejectedCount} ${rejectedCount === 1 ? 'item' : 'items'}). Admin Note: ${rejectionReason}`,
                    location: "Admin Office",
                    date: new Date().toLocaleDateString("en-PH", { month: "short", day: "numeric" }),
                    timestamp: new Date().toLocaleTimeString("en-PH", { timeZone: "Asia/Manila", hour: "2-digit", minute: "2-digit", hour12: true }),
                    performedBy: { id: adminId, role: "Admin", name: adminName }
                });

                // 📧 EMAIL - replacement rejected (with reason)
                await sendOrderStatusEmail(
                    order.email,
                    order.firstname,
                    order.orderId,
                    "replacement rejected",
                    rejectionReason
                );
            }
        }

        await order.save();

        let activityMessage = "";
        if (approvedCount > 0 && rejectedCount > 0) {
            activityMessage = `Reviewed replacement requests in order #${orderIdShort}: ${approvedCount} approved, ${rejectedCount} rejected`;
        } else if (approvedCount > 0) {
            activityMessage = `Approved ${approvedCount} replacement ${approvedCount === 1 ? 'request' : 'requests'} in order #${orderIdShort}`;
        } else {
            activityMessage = `Rejected ${rejectedCount} replacement ${rejectedCount === 1 ? 'request' : 'requests'} in order #${orderIdShort}`;
        }

        await createActivityLog(adminId, 'REVIEW REPLACEMENT REQUEST', activityMessage, req);

        return res.status(200).json({ 
            message: `Successfully reviewed ${approvedCount + rejectedCount} replacement ${approvedCount + rejectedCount === 1 ? 'request' : 'requests'}`,
            approvedCount,
            rejectedCount
        });

    } catch (error) {
        console.error("Review replacement error:", error);
        return res.status(500).json({ message: error.message });
    }
};