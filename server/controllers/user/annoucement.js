import SeasonalAnnouncement from "../../models/seasonal.js";



export const displayAnnouncement = async (req, res) => {
    try {
        // Get current date in PH time, date-only (no time component)
        const todayPH = new Date(
            new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Manila" })
        );

        const announcement = await SeasonalAnnouncement.find({
            startDate: { $lte: todayPH },
            endDate: { $gte: todayPH }
        }).sort({ createdAt: -1 });

        if (!announcement || announcement.length === 0) {
            return res.status(404).json({ message: "No announcement yet." });
        }

        res.status(200).json(announcement);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};