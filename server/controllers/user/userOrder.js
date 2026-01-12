import Cart from "../../models/cart.js";
import Order from "../../models/order.js";


const UserOrder = async(req, res)=>{
    try{
        
        const id = req.account.id;
        
        const orders = await Order.find({userId : id});

        if(!orders || orders.length === 0){
            return res.status(404).json({ message: "No ordered yet"});
        }

        res.status(200).json(orders);
    }catch(error){
        res.status(500).json({ message : error.message })
    }
}
export default UserOrder;