import ActivityLog from "../../models/activityLogs.js";
import Admin from "../../models/admin.js";



const Logout = async (req, res) => {
    try {
        // Kunin yung admin info from auth middleware
        // (Assuming may middleware ka na nag-attach ng admin sa req)
        const { id } = req.account; // or req.user, depende sa middleware mo
        
        const admin = await Admin.findOne({_id: id});


        // Get client info
        const ipAddress = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
                          req.ip || 
                          req.connection?.remoteAddress;
        const userAgent = req.get('user-agent');

        // Log the logout activity
        if (admin) {
            await ActivityLog.create({
                performedBy: admin._id,
                adminType: admin.adminType,
                action: 'LOGOUT',
                description: `${admin.adminType === 'main' ? 'Main Admin' : 'Sub Admin'} ${admin.email} logged out`,
                ipAddress: ipAddress,
                userAgent: userAgent,
                status: 'success'
            });
        }

        // Clear cookies
        res.clearCookie("accessToken", { path: "/" });
        res.clearCookie("refreshToken", { path: "/" });

        res.status(200).json({ message: "Successfully Logout from admin" });

    } catch (error) {
        // Kahit may error sa logging, i-proceed pa rin yung logout
        res.clearCookie("accessToken", { path: "/" });
        res.clearCookie("refreshToken", { path: "/" });
        res.status(200).json({ message: "Successfully Logout from admin" });
    }
};

export default Logout;