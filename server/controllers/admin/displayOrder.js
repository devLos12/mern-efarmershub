import Order from "../../models/order.js";




export const getOrders = async(req, res) =>{
    try{
        const { id } = await req.account;
        const orders = await Order.find();
        if(!orders || orders.length === 0){
            return res.status(404).json({message : "No Order Yet."});
        }
        
        const filteredOrders = orders.filter((order) => {
            const deleted = order.deletedBy.find((e) => e.id.toString() === id.toString());
            const archived = order.archivedBy.find((e) => e.id.toString() === id.toString());
            return !deleted && !archived; // Exclude both deleted AND archived
        })
        res.status(200).json(filteredOrders);
    }catch(error){
        res.status(500).json({message : error.message})
    }
}







export const removeOrders = async (req, res) =>{
    try {

        const { id } = req.account;
        const  orderId  = req.params.id;


        await Order.updateOne({_id: orderId}, {
            $addToSet: {
                deletedBy: { id }
            }
        })

        const order = await Order.findOne({_id: orderId});
        
        if(order.deletedBy.length >= 2){
            await Order.deleteOne({_id: orderId});
        }


        res.status(200).json({ message: "Successfully deleted"});
    } catch (error) {
        res.status(500).json({ message: error.message})
    }
}



// Archive order
export const archiveOrder = async (req, res) => {
    try {
        const { id } = req.account;
        const orderId = req.params.id;
        
        await Order.updateOne(
            { _id: orderId },
            {
                $addToSet: {
                    archivedBy: { 
                        id,
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

// Unarchive order
export const unarchiveOrder = async (req, res) => {
    try {
        const { id } = req.account;
        const orderId = req.params.id;
        
        await Order.updateOne(
            { _id: orderId },
            {
                $pull: {
                    archivedBy: { id }
                }
            }
        );
        
        res.status(200).json({ message: "Order unarchived successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get archived orders
export const getArchivedOrders = async (req, res) => {
    try {
        const { id } = req.account;
        const orders = await Order.find({
            "archivedBy.id": id
        });
        
        if (!orders || orders.length === 0) {
            return res.status(404).json({ message: "No archived orders" });
        }
        
        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};