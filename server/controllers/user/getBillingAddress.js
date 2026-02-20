
import jwt from "jsonwebtoken";
import User from "../../models/user.js";
import Cart from "../../models/cart.js";



const getBillingAddress = async(req, res) => {

    try{
        const decode = jwt.verify(req.cookies.accessToken, process.env.JWT_SECRET);
        
        const billingAddress = await User.findById(decode.id);

        if(!billingAddress) {
            return res.status(404).json({ message : "no item"});
        }
        
        const data = {
            billingAddress : billingAddress.billingAddress
        };

        res.status(200).json(data);
    }catch(err){
        res.status(500).json({ message : err.message});
    }
}
export default getBillingAddress;