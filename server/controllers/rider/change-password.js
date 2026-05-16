import Rider  from '../../models/rider.js';
import bcrypt from "bcrypt";



const changePassword = async (req, res) => {

    try {   
        const { id } = req.account;
        const { currentPassword, newPassword } = req.body; 

        const rider = await Rider.findOne({_id: id});
        const verify = await bcrypt.compare(currentPassword, rider.password );
                
        if(!verify) {
            return res.status(400).json({ 
                code: 'bad-request',
                success: false,
                message: "current password not match."
            });
        }
        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        rider.password = hashedPassword;
        await rider.save();            

        res.status(200).json({ 
            success: true,
            message: "Password changed successfully. "
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
    
}

export default changePassword;