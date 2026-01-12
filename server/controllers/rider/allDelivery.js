import Order from "../../models/order.js";
import Rider from "../../models/rider.js";


export const allDelivery = async(req, res) => {
    try{    
        const { id } = req.account;

        const allOrders = await Order.find({ 
            riderId: id,
            statusDelivery: { $in: ["ready to deliver", "in transit", "delivered"]}
        })

        
        if(!allOrders || allOrders.length === 0) {
            return res.status(404).json({ message: "no list of orders "});
        }

        // Filter out orders that rider has deleted
        const filteredOrders = allOrders.filter((order) => {
            const deleted = order.deletedBy.find((e) => e.id.toString() === id.toString());
            return !deleted;
        })

        if(filteredOrders.length === 0) {
            return res.status(404).json({ message: "no list of orders "});
        }

        res.status(200).json(filteredOrders);
    }catch(err){
        res.status(500).json({ message: err.message })
    }
}

export const riderDeleteOrders = async (req, res) => {
    try {
        const { items } = req.body;
        const riderId = req.account.id;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: "No orders selected for deletion" });
        }

        let deletedCount = 0;
        let permanentlyDeletedCount = 0;

        for (const orderId of items) {
            // Verify order belongs to this rider
            const order = await Order.findOne({ 
                _id: orderId,
                riderId: riderId 
            });

            if (!order) {
                continue; // Skip if order not found or doesn't belong to rider
            }

            // Add rider to deletedBy array
            await Order.updateOne(
                { _id: orderId },
                {
                    $addToSet: {
                        deletedBy: { id: riderId }
                    }
                }
            );

            // Check if order should be permanently deleted
            const updatedOrder = await Order.findOne({ _id: orderId });
            
            if (updatedOrder && updatedOrder.deletedBy.length >= 2) {
                await Order.deleteOne({ _id: orderId });
                permanentlyDeletedCount++;
            }

            deletedCount++;
        }

        return res.status(200).json({ 
            message: `Successfully deleted ${deletedCount} order(s)`,
            deletedCount,
            permanentlyDeletedCount
        });

    } catch (error) {
        console.error("Error deleting orders:", error);
        return res.status(500).json({ message: error.message });
    }
};