import PayoutTransaction from "../../models/payoutTransaction.js";
import AdminPaymentTransaction from "../../models/adminPaymentTrans.js";
import multer from "multer";
import SellerPaymentTransaction from "../../models/sellerPaymentTrans.js";
import RiderPayout from "../../models/riderPayout.js";
import { v2 as cloudinary } from "cloudinary";


// ─── Helper: Build date range filter ─────────────────────────────────────────
// NOTE: `date` field in PayoutTransaction & RiderPayout is stored as String ("YYYY-MM-DD")
// ISO date string comparison is lexicographic = chronological, so $gte/$lte works correctly
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


export const transaction = async (req, res) => {
    try {
        const { id, role } = req.account;

        // ── Date filter from query params ─────────────────────────────────────
        const { period, startDate, endDate } = req.query;
        const dateRange = getDateStringRange(period, startDate, endDate);
        // ─────────────────────────────────────────────────────────────────────

        // All three collections store dates as "YYYY-MM-DD" strings
        // so we use string $gte/$lte — works correctly for ISO format
        const payoutQuery   = dateRange ? { date: { $gte: dateRange.start, $lte: dateRange.end } } : {};
        const riderQuery    = dateRange ? { date: { $gte: dateRange.start, $lte: dateRange.end } } : {};
        const paymentQuery  = dateRange ? { 'paidAt.date': { $gte: dateRange.start, $lte: dateRange.end } } : {};

        // ── Payout (Seller) ───────────────────────────────────────────────────
        const payout = await PayoutTransaction.find(payoutQuery);
        const filteredPayouts = payout.filter((payout) => {
            const deleted = payout.deletedBy.find(
                (e) => e.id.toString() === id.toString() && e.role === role
            );
            return !deleted;
        });

        // ── Rider Payout ──────────────────────────────────────────────────────
        const riderPayout = await RiderPayout.find(riderQuery);
        const filteredRiderPayouts = riderPayout.filter((payout) => {
            const deleted = payout.deletedBy.find(
                (e) => e.id.toString() === id.toString() && e.role === role
            );
            return !deleted;
        });

        // ── Payment ───────────────────────────────────────────────────────────
        const payment = await AdminPaymentTransaction.find(paymentQuery);

        const resData = {
            payout: filteredPayouts,
            payment,
            riderPayout: filteredRiderPayouts
        };

        res.status(200).json(resData);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};




export const deletePayout = async (req, res) => {
    try {
        const { items } = req.body;
        const { id, role } = req.account;

        if (!items || !Array.isArray(items)) {
            return res.status(400).json({ message: "Invalid items array." });
        }

        await PayoutTransaction.updateMany(
            { _id: { $in: items } },
            { $addToSet: { deletedBy: { id, role } } }
        );

        await RiderPayout.updateMany(
            { _id: { $in: items } },
            { $addToSet: { deletedBy: { id, role } } }
        );

        const doubleDeletedPayout = await PayoutTransaction.find({
            _id: { $in: items },
            "deletedBy.role": { $all: ["admin", "seller"] }
        });

        const doubleDeletedRider = await RiderPayout.find({
            _id: { $in: items },
            "deletedBy.role": { $all: ["admin", "rider"] }
        });

        if (doubleDeletedPayout.length > 0) {
            const ids = doubleDeletedPayout.map(item => item._id);
            await PayoutTransaction.deleteMany({ _id: { $in: ids } });
        }

        if (doubleDeletedRider.length > 0) {
            const ids = doubleDeletedRider.map(item => item._id);
            await RiderPayout.deleteMany({ _id: { $in: ids } });
        }

        res.status(200).json({
            message: "Successfully deleted",
            hardDeletedPayout: doubleDeletedPayout.map(item => item._id),
            hardDeletedRider: doubleDeletedRider.map(item => item._id),
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


export const deletePayment = async (req, res) => {
    try {
        const { items } = req.body;
        await AdminPaymentTransaction.deleteMany({ _id: { $in: items } });
        res.status(200).json({ message: "successfully deleted" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


const storage = multer.memoryStorage();
export const payout = multer({ storage: storage });


export const updatePayout = async (req, res) => {
    try {
        const { id } = req.body;
        let imageFile = null;

        if (req.file) {
            const base64 = req.file.buffer.toString('base64');
            const dataURI = `data:${req.file.mimetype};base64,${base64}`;
            const result = await cloudinary.uploader.upload(dataURI, { folder: "payout-receipts" });
            imageFile = result.secure_url;
        }

        await PayoutTransaction.findByIdAndUpdate(id, { $set: { status: "paid", imageFile } });
        await RiderPayout.findByIdAndUpdate(id, { $set: { status: "paid", imageFile } });

        const seller = await PayoutTransaction.findOne({ _id: id });
        const rider = await RiderPayout.findOne({ _id: id });

        const date = new Date().toISOString().split("T")[0].replace(/-/g, "");
        const random = Math.floor(10000 + Math.random() * 90000);
        const refNo = `REF${date}-${random}`;

        await AdminPaymentTransaction.create({
            accountId: seller?.sellerId ?? rider?.riderId,
            accountName: seller?.sellerName ?? rider?.riderName,
            accountEmail: seller?.sellerEmail ?? rider?.riderEmail,
            type: seller ? "seller payout" : "rider payout",
            paymentMethod: "gcash",
            totalAmount: seller?.totalAmount ?? rider?.totalAmount,
            status: "paid",
            paidAt: {
                date: new Date().toISOString().split("T")[0],
                time: new Date().toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", hour12: true })
            },
            refNo,
            imageFile: imageFile
        });

        if (seller) {
            await SellerPaymentTransaction.create({
                sellerId: seller.sellerId,
                accountId: seller.sellerId,
                accountName: seller.sellerName,
                accountEmail: seller.sellerEmail,
                type: "seller payout",
                paymentMethod: "gcash",
                totalAmount: seller.totalAmount,
                status: "paid",
                paidAt: {
                    date: new Date().toISOString().split("T")[0],
                    time: new Date().toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", hour12: true })
                },
                refNo
            });
        }

        res.status(200).json({ message: `Payout receipt successfully sent.` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};