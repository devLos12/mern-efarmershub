import Seller from "../../models/seller.js";
import bcrypt from "bcrypt";



const changePassword = async (req, res) => {

    try {   
        const { id } = req.account;
        const { currentPassword, newPassword } = req.body; 

        const seller = await Seller.findOne({_id: id});
        const verify = await bcrypt.compare(currentPassword, seller.password );

        if(!verify) {
            return res.status(400).json({ message: "current password not match."});
        }
        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        seller.password = hashedPassword;
        await seller.save();            

        res.status(200).json({ message: "Password changed successfully. "});
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
    
}

export default changePassword;