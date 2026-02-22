import ActivityLog from "../../models/activityLogs.js";


// ─── Helper: Build createdAt date filter ──────────────────────────────────────
const getDateFilter = (period, startDate, endDate) => {
    const now = new Date();

    switch (period) {
        case "thisweek": {
            const dayOfWeek = now.getDay();
            const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
            const weekStart = new Date(now);
            weekStart.setDate(now.getDate() - daysFromMonday);
            weekStart.setHours(0, 0, 0, 0);
            return { $gte: weekStart, $lte: now };
        }
        case "thismonth": {
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            return { $gte: monthStart, $lte: now };
        }
        case "thisyear": {
            const yearStart = new Date(now.getFullYear(), 0, 1);
            return { $gte: yearStart, $lte: now };
        }
        case "custom": {
            if (startDate && endDate) {
                const start = new Date(startDate);
                start.setHours(0, 0, 0, 0);
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                return { $gte: start, $lte: end };
            }
            return null;
        }
        default:
            return null; // "all" — no date filter
    }
};
// ─────────────────────────────────────────────────────────────────────────────


export const getActivityLogs = async (req, res) => {
    try {
        // ── Date filter from query params ─────────────────────────────────────
        const { period, startDate, endDate } = req.query;
        const dateFilter = getDateFilter(period, startDate, endDate);
        // ─────────────────────────────────────────────────────────────────────

        const query = dateFilter ? { createdAt: dateFilter } : {};

        const logs = await ActivityLog.find(query)
            .populate('performedBy', 'email')
            .sort({ createdAt: -1 });

        return res.status(200).json(logs);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};


export const deleteActivityLogs = async (req, res) => {
    try {
        const { items } = req.body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: "No items provided for deletion" });
        }

        const result = await ActivityLog.deleteMany({ _id: { $in: items } });

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: "No logs found to delete" });
        }

        return res.status(200).json({
            message: `Successfully deleted ${result.deletedCount} activity log(s)`
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};


export const createActivityLog = async (adminId, adminType, action, description, ipAddress, userAgent, status = 'success') => {
    try {
        const log = new ActivityLog({
            performedBy: adminId,
            adminType,
            action,
            description,
            ipAddress,
            userAgent,
            status
        });
        await log.save();
        return log;
    } catch (error) {
        console.error('Error creating activity log:', error.message);
        return null;
    }
};