import jwt from "jsonwebtoken";
import User from "../../models/user.js";


const getCookieIdBillingAddress = async(req, res) => {
    try{
        const decoded = jwt.verify(req.cookies.accessToken, process.env.JWT_SECRET);

        const billingAddress = await User.findById(decoded.id);


        const isEmptyBillingAddress = !billingAddress.billingAddress || 
        Object.values(billingAddress.billingAddress).every(val => !val);
        
        if (isEmptyBillingAddress) {
            return res.status(202).json({ id: decoded.id,  message : "add address"})
        }


        res.status(200).json({id: decoded.id, message : "change address"});
    }catch(err){
        res.status(500).json({ message : err.message});
    }
}

export default getCookieIdBillingAddress;