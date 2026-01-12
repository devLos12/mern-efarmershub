import Order from "../../models/order.js";

const getOrderDetails = async(req, res) =>{
    try{
        const orderId = req.params.id;
        const { id } = req.account;

        const order = await Order.findOne({_id : orderId});
        
        if(!order){
            return res.status(404).json({ message : "no data"});
        }

        // Filter items para sa seller
        const sellerItems = order.orderItems.filter(
            (item) => item.seller.id.toString() === id.toString()
        );

        // Calculate total price based sa filtered items
        const sellerTotalPrice = sellerItems.reduce((total, item) => {
            return total + (item.prodPrice * item.quantity);
        }, 0);

        const filteredOrder = {
            ...order.toObject(),
            orderItems: sellerItems,
            totalPrice: sellerTotalPrice // Override with calculated total
        };

        res.status(200).json(filteredOrder);
    }catch(err){
        res.status(500).json({ message : err.message});
    }
}

export default getOrderDetails;