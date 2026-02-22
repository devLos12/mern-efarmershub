import SellerPaymentTransaction from "../../models/sellerPaymentTrans.js";
import PayoutTransaction from "../../models/payoutTransaction.js";
import multer from "multer";


// ─── Helper: same logic as transactionController ──────────────────────────────
// `date` field is String ("YYYY-MM-DD") — string comparison = chronological order
const getDateStringRange = (period, startDate, endDate) => {
    const now = new Date();
    const toDateStr = (d) => d.toISOString().split('T')[0];
    const todayStr = toDateStr(now);

    switch (period) {
        case "thisweek": {
            const dayOfWeek = now.getDay();
            const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday-based
            const weekStart = new Date(now);
            weekStart.setDate(now.getDate() - daysFromMonday);
            return { start: toDateStr(weekStart), end: todayStr };
        }
        case "thismonth": {
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            return { start: toDateStr(monthStart), end: todayStr };
        }
        case "thisyear": {
            const yearStart = new Date(now.getFullYear(), 0, 1);
            return { start: toDateStr(yearStart), end: todayStr };
        }
        case "custom": {
            if (startDate && endDate) return { start: startDate, end: endDate };
            return null;
        }
        default:
            return null; // no filter — return all
    }
};
// ─────────────────────────────────────────────────────────────────────────────


export const getSellerTransaction = async (req, res) => {
    try {
        const { id, role } = req.account;

        // ── Date filter from query params ─────────────────────────────────────
        const { period, startDate, endDate } = req.query;
        const dateRange = getDateStringRange(period, startDate, endDate);
        // ─────────────────────────────────────────────────────────────────────

        const payoutQuery = {
            sellerId: id,
            ...(dateRange && { date: { $gte: dateRange.start, $lte: dateRange.end } })
        };

        const paymentQuery = {
            sellerId: id,
            ...(dateRange && { 'paidAt.date': { $gte: dateRange.start, $lte: dateRange.end } })
        };

        const payout = await PayoutTransaction.find(payoutQuery);
        const filteredPayouts = payout.filter((payout) => {
            const deleted = payout.deletedBy.find(
                (e) => e.id.toString() === id.toString() && e.role === role
            );
            return !deleted;
        });

        const payment = await SellerPaymentTransaction.find(paymentQuery);

        const resData = { payout: filteredPayouts, payment };
        res.status(200).json(resData);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


export const sellerDeletePayment = async (req, res) => {
    try {
        const { items } = req.body;
        await SellerPaymentTransaction.deleteMany({ _id: { $in: items } });
        res.status(200).json({ message: "Successfully Deleted" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


export const sellerDeletePayout = async (req, res) => {
    try {
        const { items } = req.body;
        const { id, role } = req.account;

        await PayoutTransaction.updateMany(
            { _id: { $in: items } },
            { $addToSet: { deletedBy: { id, role } } }
        );

        const doubleDeleted = await PayoutTransaction.find({
            _id: { $in: items },
            "deletedBy.role": { $all: ["admin", "seller"] }
        });

        if (doubleDeleted.length > 0) {
            const idsToRemove = doubleDeleted.map((item) => item._id);
            await PayoutTransaction.deleteMany({ _id: { $in: idsToRemove } });
        }

        res.status(200).json({ message: "succesfully deleted." });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};