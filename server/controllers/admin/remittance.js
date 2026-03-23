import Remit from "../../models/remittance.js";
import cloudinary from "../../config/cloudinary.js";


import multer from "multer";
export const uploadRemit = multer({ storage: multer.memoryStorage() });


// ─── Helpers ──────────────────────────────────────────────────────────────────
const getPeriodDateRange = (period) => {
    const now = new Date();
    let startDate = null;
    let endDate = null;
    switch (period) {
        case "today": {
            startDate = new Date();
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date();
            endDate.setHours(23, 59, 59, 999);
            break;
        }
        case "thisweek": {
            const day = now.getDay();
            const diffToMonday = (day === 0 ? -6 : 1 - day);
            startDate = new Date(now);
            startDate.setDate(now.getDate() + diffToMonday);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(now);
            endDate.setHours(23, 59, 59, 999);
            break;
        }
        case "thismonth": {
            startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
            endDate = new Date(now);
            endDate.setHours(23, 59, 59, 999);
            break;
        }
        case "thisyear": {
            startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
            endDate = new Date(now);
            endDate.setHours(23, 59, 59, 999);
            break;
        }
        default:
            break;
    }
    return { startDate, endDate };
};
// ──────────────────────────────────────────────────────────────────────────────


// ─── GET /api/getRemittances ───────────────────────────────────────────────────
export const getRemittances = async (req, res) => {
    try {
        const { period = "all", startDate, endDate } = req.query;
        let dateFilter = {};
        if (period === "custom" && startDate && endDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            dateFilter = { createdAt: { $gte: start, $lte: end } };
        } else if (period !== "all") {
            const { startDate: s, endDate: e } = getPeriodDateRange(period);
            if (s && e) dateFilter = { createdAt: { $gte: s, $lte: e } };
        }
        const remittances = await Remit.find(dateFilter)
            .populate("orderId", "orderId")
            .populate("riderId", "firstname lastname email")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            message: "Remittances fetched successfully.",
            data: remittances,
        });
    } catch (error) {
        console.error("getRemittances error:", error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
};
// ──────────────────────────────────────────────────────────────────────────────


// ─── PATCH /api/updateRemittanceStatus/:id ────────────────────────────────────
// Expects multipart/form-data: { status: "remitted", image: <file> }
export const updateRemittanceStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;


        if (!status) {
            return res.status(400).json({ success: false, message: "Status is required." });
        }


        const allowedStatuses = ["pending", "remitted", "failed", "processing"];
        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status. Allowed: ${allowedStatuses.join(", ")}.`,
            });
        }

        // ── Require image proof when marking as remitted ──────────────────────
        if (status === "remitted" && !req.file) {
            return res.status(400).json({ success: false, message: "Proof of remittance image is required." });
        }
        // ─────────────────────────────────────────────────────────────────────

        const updatePayload = { status };

        // ── Upload image to Cloudinary via buffer (memoryStorage) ─────────────
        if (req.file) {
            const uploadResult = await new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    { folder: "remittances" },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result);
                    }
                );
                stream.end(req.file.buffer);
            });

            updatePayload.imageFile = uploadResult.secure_url;
            updatePayload.cloudinaryId = uploadResult.public_id;
        }
        // ─────────────────────────────────────────────────────────────────────

        if (status === "remitted") updatePayload.remittedAt = new Date();

        const updated = await Remit.findByIdAndUpdate(
            id,
            { $set: updatePayload },
            { new: true }
        );

        if (!updated) {
            return res.status(404).json({ success: false, message: "Remittance record not found." });
        }

        return res.status(200).json({
            success: true,
            message: "Updated successfully.",
            data: [updated],
        });
    } catch (error) {
        console.error("updateRemittanceStatus error:", error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
};
// ──────────────────────────────────────────────────────────────────────────────


// ─── DELETE /api/deleteRemittances ────────────────────────────────────────────
export const deleteRemittances = async (req, res) => {
    try {
        const { ids } = req.body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ success: false, message: "No IDs provided for deletion." });
        }

        // ── Delete Cloudinary images if they exist ────────────────────────────
        const records = await Remit.find({ _id: { $in: ids } });
        const deleteImagePromises = records
            .filter((r) => r.cloudinaryId)
            .map((r) => cloudinary.uploader.destroy(r.cloudinaryId));
        await Promise.allSettled(deleteImagePromises);
        // ─────────────────────────────────────────────────────────────────────

        const result = await Remit.deleteMany({ _id: { $in: ids } });

        return res.status(200).json({
            success: true,
            message: `${result.deletedCount} remittance record(s) deleted successfully.`,
            deletedCount: result.deletedCount,
        });
    } catch (error) {
        console.error("deleteRemittances error:", error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
};