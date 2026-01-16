import ActivityLog from "../../models/activityLogs.js";
import Admin from "../../models/admin.js";




const Logout = async (req, res) => {
    try {
        const { id } = req.account;
        
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

        // Check if local or production (same logic from CookieSetUp)
        const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').map(o => o.trim()) || [];
        const isLocal = allowedOrigins.some(origin => 
            origin.includes('localhost') || origin.startsWith('http://')
        );

        // Cookie options - dapat same sa CookieSetUp
        const cookieOptions = {
            httpOnly: true,
            secure: !isLocal,
            sameSite: isLocal ? 'lax' : 'none',
            path: "/"
        };

        // Clear cookies with proper options
        res.clearCookie("accessToken", cookieOptions);
        res.clearCookie("refreshToken", cookieOptions);

        res.status(200).json({ message: "Successfully Logout from admin" });

    } catch (error) {
        // Kahit may error sa logging, i-proceed pa rin yung logout
        const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').map(o => o.trim()) || [];
        const isLocal = allowedOrigins.some(origin => 
            origin.includes('localhost') || origin.startsWith('http://')
        );

        const cookieOptions = {
            httpOnly: true,
            secure: !isLocal,
            sameSite: isLocal ? 'lax' : 'none',
            path: "/"
        };

        res.clearCookie("accessToken", cookieOptions);
        res.clearCookie("refreshToken", cookieOptions);
        
        res.status(200).json({ message: "Successfully Logout from admin" });
    }
};

export default Logout;