import Order from "../../models/order.js";


const getOrderDetails = async(req, res) =>{
    try{

        const orderId = req.params.id;

        const order = await Order.findOne({_id : orderId});
        if(!order){
            return res.status(404).json({ message : "no data"});
        }

        res.status(200).json(order);
    }catch(err){
        res.status(500).json({ message : err.message});
    }

}
export default getOrderDetails;