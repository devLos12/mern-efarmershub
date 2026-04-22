import ActivityLog from "../../models/activityLogs.js";
import Admin from "../../models/admin.js";



export const createActivityLog = async (adminId, action, description, req) => {
    try {
        const admin = await Admin.findById(adminId);
        if (!admin) {
            console.error("Activity log: Admin not found →", adminId);
            return;
        }
 
        const ipAddress =
            req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
            req.ip ||
            req.connection?.remoteAddress;
 
        const userAgent = req.get("user-agent");
        
        await ActivityLog.create({
            performedBy: adminId,
            adminType: admin.adminType,
            action,
            description,
            ipAddress,
            userAgent,
            status: "success",
        });
    } catch (error) {
        // Non-blocking — log error but don't crash the main flow
        console.error("Failed to create activity log:", error.message);
    }
};