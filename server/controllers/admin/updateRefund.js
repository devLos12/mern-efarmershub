import Order from "../../models/order.js";
import Admin from "../../models/admin.js";
import ActivityLog from "../../models/activityLogs.js";
import multer from "multer";

// Helper function to create activity log
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

const storage = multer.diskStorage({
    destination: "./uploads",
    filename: (req, file, cb) => {
        cb(null, file.originalname)
    }
});

export const uploadRefundFile = multer({ storage: storage });

export const updateRefund = async (req, res) => {
    try {
        const { orderId, refundStatus } = req.body;
        const refundReceipt = req.file?.filename || "";
        const adminId = req.account.id;

        // Validate required fields
        if (!orderId || !refundStatus) {
            return res.status(400).json({ message: "Order ID and refund status are required" });
        }

        // Find the order
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        const orderIdShort = order.orderId || orderId.toString().slice(-8);

        // Check if order has cancellation and refund
        if (!order.cancellation?.isCancelled || !order.cancellation?.refund?.isEligible) {
            return res.status(400).json({ message: "This order is not eligible for refund" });
        }

        // Update refund status
        order.cancellation.refund.status = refundStatus;

        // If moving to processing or completed, update processedAt and processedBy
        if (refundStatus === "processing" || refundStatus === "completed") {
            order.cancellation.refund.processedAt = new Date();
            order.cancellation.refund.processedBy = req.account?._id;
        }

        // Create status history entry based on refund status
        let statusDescription = "";
        let statusLabel = "";
        let activityAction = "";
        let activityDesc = "";

        switch (refundStatus) {
            case "processing":
                statusLabel = "refund processing";
                statusDescription = "Refund is being processed by admin";
                order.statusDelivery = statusLabel;
                activityAction = "UPDATE REFUND STATUS";
                activityDesc = `Started processing refund for order #${orderIdShort}`;
                break;
            case "completed": {

                statusLabel = "refund completed";
                statusDescription = "Refund has been successfully completed. here's your refund receipt below.";
                order.statusDelivery = "refund completed";
                activityAction = "COMPLETE REFUND";
                const receiptText = refundReceipt ? " with receipt attached" : "";
                activityDesc = `Completed refund for order #${orderIdShort}${receiptText}`;
                break;
            }
            case "rejected": 
                statusLabel = "refund rejected";
                statusDescription = "Refund request has been rejected";
                order.statusDelivery = statusLabel;
                activityAction = "REJECT REFUND";
                activityDesc = `Rejected refund request for order #${orderIdShort}`;
                break;
        }

        // Add to status history
        const newStatusEntry = {
            status: statusLabel,
            description: statusDescription,
            location: "Admin Office",
            imageFile: refundReceipt
        };
            
        order.statusHistory.push(newStatusEntry);
        
        // Save the updated order
        await order.save();

        // Log activity
        await createActivityLog(
            adminId,
            activityAction,
            activityDesc,
            req
        );

        return res.status(200).json({
            message: `Refund status successfully updated to ${refundStatus}`,
        });

    } catch (error) {
        console.error("Update refund error:", error);
        return res.status(500).json({ message: error.message });
    }
}

export const rejectRefundFile = multer({ storage: storage });

export const rejectRefund = async (req, res) => {
    try {
        const { orderId, reason, refundStatus } = req.body;
        const proofImage = req.file ? req.file.filename : null;
        const adminId = req.account.id;

        // Validate required fields
        if (!orderId || !reason || !reason.trim()) {
            return res.status(400).json({ message: "Order ID and reason are required" });
        }

        const order = await Order.findById(orderId);
        
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        const orderIdShort = order.orderId || orderId.toString().slice(-8);

        // Check if order has refund information
        if (!order.cancellation?.refund) {
            return res.status(400).json({ message: "No refund request found for this order" });
        }

        // Update refund status to rejected
        order.cancellation.refund.status = "rejected";
        order.cancellation.refund.rejectedAt = new Date();

        // Update main order status
        order.statusDelivery = refundStatus;
        
        // Add to status history
        order.statusHistory.push({
            status: refundStatus,
            description: `Refund request rejected by admin. Reason: ${reason}`,
            location: "Admin Office",
            imageFile: proofImage
        });

        await order.save();

        // Log activity
        const proofText = proofImage ? " with proof attached" : "";
        await createActivityLog(
            adminId,
            "REJECT REFUND WITH REASON",
            `Rejected refund for order #${orderIdShort}${proofText}. Reason: ${reason.substring(0, 50)}${reason.length > 50 ? '...' : ''}`,
            req
        );

        return res.status(200).json({ 
            message: "Refund request rejected successfully",
        });

    } catch (error) {
        console.error("Reject refund error:", error);
        return res.status(500).json({ message: error.message });
    }
};