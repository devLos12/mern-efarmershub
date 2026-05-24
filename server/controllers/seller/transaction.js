import SellerPaymentTransaction from "../../models/sellerPaymentTrans.js";
import PayoutTransaction from "../../models/payoutTransaction.js";
import multer from "multer";


// ─── Helper: same logic as transactionController ──────────────────────────────
// `date` field is String ("YYYY-MM-DD") — string comparison = chronological order
const getDateStringRange = (period, startDate, endDate) => {
    const now = new Date();
    // ✅ PHT
    const todayStr = now.toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });
    const toPHTDateStr = (d) => d.toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });

    switch (period) {
        case "today":
            return { start: todayStr, end: todayStr };

        case "thisweek": {
            const phNow = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Manila" }));
            const dayOfWeek = phNow.getDay();
            const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
            const weekStart = new Date(phNow);
            weekStart.setDate(phNow.getDate() - daysFromMonday);
            return { start: toPHTDateStr(weekStart), end: todayStr };
        }
        case "thismonth": {
            const phNow = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Manila" }));
            const monthStart = new Date(phNow.getFullYear(), phNow.getMonth(), 1);
            return { start: toPHTDateStr(monthStart), end: todayStr };
        }
        case "thisyear": {
            const phNow = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Manila" }));
            const yearStart = new Date(phNow.getFullYear(), 0, 1);
            return { start: toPHTDateStr(yearStart), end: todayStr };
        }
        case "custom":
            if (startDate && endDate) return { start: startDate, end: endDate };
            return null;
        default:
            return null;
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

        const payout = await PayoutTransaction.find(payoutQuery)
            .populate('sellerId', 'accountId e_WalletAcc'); // 👈

        const filteredPayouts = payout
            .filter((payout) => {
                const deleted = payout.deletedBy.find(
                    (e) => e.id.toString() === id.toString() && e.role === role
                );
                return !deleted;
            })
            .map((payout) => {
                const obj = payout.toObject();
                return {
                    ...obj,
                    e_WalletAcc: payout.sellerId?.e_WalletAcc ?? obj.e_WalletAcc,
                    accountId: payout.sellerId?.accountId
                };
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