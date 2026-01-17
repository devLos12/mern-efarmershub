import User from "../../models/user.js";
import Admin from "../../models/admin.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Seller from "../../models/seller.js";
import ActivityLog from "../../models/activityLogs.js";




const CookieSetUp = (res, account, role) => {
    const accessToken = jwt.sign(
        { id: account._id, role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES }
    );

    const refreshToken = jwt.sign(
        { id: account._id, role },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRES }
    );

    // Check if running on localhost/local network
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').map(o => o.trim()) || [];
    const isLocal = allowedOrigins.some(origin => 
        origin.includes('localhost') || origin.startsWith('http://')
    );

    const cookieOptions = {
        httpOnly: true,
        secure: !isLocal,  // false for local, true for production
        sameSite: isLocal ? 'lax' : 'none',
        path: "/",
    };
        
    res.cookie("accessToken", accessToken, cookieOptions);
    
    res.cookie("refreshToken", refreshToken, {
        ...cookieOptions,
    });
}



const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        let account = null;
        let role = null;


        const ipAddress = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
                          req.ip || 
                          req.connection?.remoteAddress;
        
        const userAgent = req.get('user-agent');


        account = await Admin.findOne({ email });
        role = "admin";


        if (!account) {
            account = await User.findOne({ email });
            role = "user";
        }

        if(!account) {
            account = await Seller.findOne({ email });
            role = "seller";
        }
        
        if (!account) {
            if(role === "admin"){
                await ActivityLog.create({
                    performedBy: account._id,
                    adminType: account.adminType,
                    action: 'LOGIN FAILED',
                    description: `Failed login: ${email}`,
                    ipAddress: ipAddress,
                    userAgent: userAgent,
                    status: 'failed'
                });
             }

            return res.status(401).json({ message: "Invalid Email!" });     
        }

        // Check password - all roles now use bcrypt
        const isMatch = await bcrypt.compare(password, account.password);
        
        if (!isMatch) {

            if(role === "admin"){
                await ActivityLog.create({
                    performedBy: account._id,
                    adminType: account.adminType,
                    action: 'LOGIN FAILED',
                    description: `Failed login: ${email}`,
                    ipAddress: ipAddress,
                    userAgent: userAgent,
                    status: 'failed'
                });
            }

            return res.status(401).json({ message: "Invalid Password!" });
        }

        // Check seller verification status
        if (role === "seller") {
            if (account.verification === "pending") {
                return res.status(403).json({ 
                    message: "Your account is pending verification. Please wait for admin approval. We will send you an email if you are verified thank you.",
                    verificationStatus: "pending"
                });
            }
            
            if (account.verification === "rejected") {
                return res.status(403).json({ 
                    message: "Your account verification has been rejected. Please contact support.",
                    verificationStatus: "rejected"
                });
            }
        }

        CookieSetUp(res, account, role);

        if(role === "admin"){
            await ActivityLog.create({
                performedBy: account._id,
                adminType: account.adminType,
                action: 'LOGIN',
                description: `${account.adminType === 'main' ? 'Main Admin' : 'Sub Admin'} ${account.email} logged in successfully`,
                ipAddress: ipAddress,
                userAgent: userAgent,
                status: 'success'
            });
        }

        return res.status(200).json({
            message: `Successfully Logged In as ${
                role==="user" ? "buyer" : role === "seller" ? "farmer" : role}`,
            role,
        });

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Failed to login" });
    }
};

export default login;