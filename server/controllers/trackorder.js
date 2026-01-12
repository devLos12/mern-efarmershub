import Order from "../models/order.js";
import Rider from "../models/rider.js";

const trackOrder = async(req, res) =>{

    try{
        const { role } = req.account;
        const id = req.params.id;


        const order = await Order.findOne({_id : id});
        const rider = await Rider.findOne({ _id: order.riderId });

        const resData = {
            statusHistory: order.statusHistory,
            rider: rider
        }

        res.status(200).json(resData);
    }catch(error){
        res.status(500).json({ message : error.message});
    }
}
export default trackOrder;



