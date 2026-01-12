import ActivityLog from "../../models/activityLogs.js";


// Get all activity logs
export const getActivityLogs = async(req, res) => {
    try {
        const logs = await ActivityLog.find()
            .populate('performedBy', 'email')
            .sort({ createdAt: -1 }); // Latest first
        
        return res.status(200).json(logs);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}


// Delete multiple activity logs
export const deleteActivityLogs = async(req, res) => {
    try {
        const { items } = req.body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: "No items provided for deletion" });
        }

        const result = await ActivityLog.deleteMany({
            _id: { $in: items }
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: "No logs found to delete" });
        }

        return res.status(200).json({ 
            message: `Successfully deleted ${result.deletedCount} activity log(s)` 
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}


// Helper function to create activity log
export const createActivityLog = async(adminId, adminType, action, description, ipAddress, userAgent, status = 'success') => {
    try {
        const log = new ActivityLog({
            performedBy: adminId,
            adminType: adminType,
            action: action,
            description: description,
            ipAddress: ipAddress,
            userAgent: userAgent,
            status: status
        });

        await log.save();
        return log;
    } catch (error) {
        console.error('Error creating activity log:', error.message);
        return null;
    }
}
