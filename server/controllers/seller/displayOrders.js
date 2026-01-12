import Order from "../../models/order.js";




export const displayOrders = async (req, res) => {
    try {
        const sellerId = req.account.id;
        const sellerOrders = await Order.find({
            "orderItems.seller.id" : sellerId
        });
        
        if(!sellerOrders || sellerOrders.length === 0){
            return res.status(404).json({ message : "No order yet"})
        }
        
        const orders = sellerOrders.map(order => {
            const sellerItems = order.orderItems.filter(
                (item) => item.seller.id.toString() === sellerId.toString()  
            );
            
            const sellerTotalPrice = sellerItems.reduce((total, item) => {
                return total + (item.prodPrice * item.quantity);
            }, 0);
            
            return {
                ...order.toObject(),
                orderItems: sellerItems,
                totalPrice: sellerTotalPrice
            };
        });
        
        const filteredOrders = orders.filter((order) => {
            const deleted = order.deletedBy.find((e) => e.id.toString() === sellerId.toString());
            const archived = order.archivedBy.find((e) => e.id.toString() === sellerId.toString());
            return !deleted && !archived; // Exclude both deleted AND archived
        });
        
        res.status(200).json(filteredOrders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};







export const deleteOrder = async(req, res) => {
    try {
        const { id } = req.account;
        const orderId = req.params.id;


        await Order.updateOne({_id: orderId}, {
            $addToSet: {
                deletedBy: { id }
            }
        })

        const order = await Order.findOne({_id: orderId});

        if(order.deletedBy.length >= 2){
            await Order.deleteOne({_id: orderId});
        }


        res.status(200).json({ message: "deleted succesfully."});
    } catch (error) {
        res.status(500).json({ message: error.message });

    }
}





// Archive order (Seller)
export const archiveSellerOrder = async (req, res) => {
    try {
        const sellerId = req.account.id;
        const orderId = req.params.id;
        
        await Order.updateOne(
            { _id: orderId },
            {
                $addToSet: {
                    archivedBy: { 
                        id: sellerId,
                        archivedAt: new Date()
                    }
                }
            }
        );
        
        res.status(200).json({ message: "Order archived successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Unarchive order (Seller)
export const unarchiveSellerOrder = async (req, res) => {
    try {
        const sellerId = req.account.id;
        const orderId = req.params.id;
        
        await Order.updateOne(
            { _id: orderId },
            {
                $pull: {
                    archivedBy: { id: sellerId }
                }
            }
        );
        
        res.status(200).json({ message: "Order unarchived successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get archived orders (Seller)
export const getArchivedSellerOrders = async (req, res) => {
    try {
        const sellerId = req.account.id;
        
        const sellerOrders = await Order.find({
            "orderItems.seller.id": sellerId,
            "archivedBy.id": sellerId
        });
        
        if (!sellerOrders || sellerOrders.length === 0) {
            return res.status(404).json({ message: "No archived orders" });
        }
        
        const orders = sellerOrders.map(order => {
            const sellerItems = order.orderItems.filter(
                (item) => item.seller.id.toString() === sellerId.toString()  
            );
            
            const sellerTotalPrice = sellerItems.reduce((total, item) => {
                return total + (item.prodPrice * item.quantity);
            }, 0);
            
            return {
                ...order.toObject(),
                orderItems: sellerItems,
                totalPrice: sellerTotalPrice
            };
        });
        
        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};