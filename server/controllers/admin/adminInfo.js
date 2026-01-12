import Admin from "../../models/admin.js";

const AdminInfo = async(req, res) => {
    try {
        const { id } = req.account;

        const admin = await Admin.findOne({_id : id});

        if(!admin) {
            
            // Clear the cookie since admin doesn't exist anymore
            res.clearCookie("accessToken", {
                httpOnly: true,
                sameSite: "strict"
            });
            res.clearCookie("refreshToken", {
                httpOnly: true,
                sameSite: "strict"
            });
            
            return res.status(404).json({ 
                message: "Admin account not found. Please login again."
            });
        }

        res.status(200).json({ message: admin});
    }catch(error) {
        res.status(500).json({ message: error.message});
    }
}

export default AdminInfo;