import Admin from "../../models/admin.js";
import bcrypt from "bcrypt";
import { createActivityLog } from "./activity-log.js";


const changePassword = async (req, res) => {
    try {   
        const { id } = req.account;
        const { currentPassword, newPassword } = req.body; 

        const admin = await Admin.findOne({ _id: id });

        if (!admin) {
            return res.status(404).json({ message: "Admin not found." });
        }

        const verify = await bcrypt.compare(currentPassword, admin.password);

        if (!verify) {
            return res.status(400).json({ message: "Current password does not match." });
        }
        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        admin.password = hashedPassword;
        await admin.save();            

        

        await createActivityLog(
            req.account.id,
            'CHANGE PASSWORD',
            `Changed own password: ${admin.firstname} ${admin.lastname} (${admin.accountId})`,
            req
        );

        res.status(200).json({ message: "Password changed successfully." });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export default changePassword;