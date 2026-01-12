import Order from "../models/order.js";

const trackReplacementProduct = async (req, res) => {
    try {
        const { orderId, itemId } = req.params;
        const userId = req.account.id;
        const role = req.account.role;



        const order = await Order.findById(orderId);
        
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        // Check authorization
        if (role === "user" && order.userId.toString() !== userId) {
            return res.status(403).json({ message: "Unauthorized access" });
        }

        // Find the specific item
        const item = order.orderItems.id(itemId);
        
        if (!item) {
            return res.status(404).json({ message: "Item not found in order" });
        }

        if (!item.replacement?.isRequested) {
            return res.status(404).json({ message: "No replacement request found for this item" });
        }

        // Return the history from replacement object
        return res.status(200).json({
            history: item.history || [],
            rider: order.riderId ? {
                _id: order.riderId,
                name: order.riderName
            } : null
        });

    } catch (error) {
        console.error("Track replacement error:", error);
        return res.status(500).json({ message: error.message });
    }
};

export default trackReplacementProduct;