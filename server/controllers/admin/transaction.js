import PayoutTransaction from "../../models/payoutTransaction.js";
import AdminPaymentTransaction from "../../models/adminPaymentTrans.js";
import multer from "multer";
import SellerPaymentTransaction from "../../models/sellerPaymentTrans.js";
import RiderPayout from "../../models/riderPayout.js";
import OfflineFarmerPayout from "../../models/offlineFarmerPayout.js";
import { v2 as cloudinary } from "cloudinary";
import OfflineFarmerPaymentTransaction from "../../models/offlineFarmerPaymentTrans.js";






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
        const offlineFarmerQuery = dateRange ? { date: { $gte: dateRange.start, $lte: dateRange.end } } : {};
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

        // ── Offline Farmer Payout (No Device) ─────────────────────────────────
        const offlineFarmerPayout = await OfflineFarmerPayout.find(offlineFarmerQuery);

        // ── Payment ───────────────────────────────────────────────────────────
        const payment = await AdminPaymentTransaction.find(paymentQuery);

        const resData = {
            payout: filteredPayouts,
            payment,
            riderPayout: filteredRiderPayouts,
            offlineFarmerPayout: offlineFarmerPayout
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

        // Soft delete for PayoutTransaction & RiderPayout (shared with seller/rider)
        await PayoutTransaction.updateMany(
            { _id: { $in: items } },
            { $addToSet: { deletedBy: { id, role } } }
        );

        await RiderPayout.updateMany(
            { _id: { $in: items } },
            { $addToSet: { deletedBy: { id, role } } }
        );

        // Hard delete for OfflineFarmerPayout (admin-only, no sharing)
        await OfflineFarmerPayout.deleteMany({ _id: { $in: items } });

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

        // ✅ Upload image kung may file (optional — offline farmer walang image)
        if (req.file) {
            const base64 = req.file.buffer.toString('base64');
            const dataURI = `data:${req.file.mimetype};base64,${base64}`;
            const result = await cloudinary.uploader.upload(dataURI, { folder: "payout-receipts" });
            imageFile = result.secure_url;
        }

        // ✅ Identify muna kung sino — sequential, not all at once
        const seller = await PayoutTransaction.findById(id);
        const rider = !seller ? await RiderPayout.findById(id) : null;
        const offlineFarmer = !seller && !rider ? await OfflineFarmerPayout.findById(id) : null;

        if (!seller && !rider && !offlineFarmer) {
            return res.status(404).json({ message: "Payout record not found" });
        }

        // ✅ I-update lang yung tamang model
        if (seller) {
            await PayoutTransaction.findByIdAndUpdate(id, { $set: { status: "paid", imageFile } });
        } else if (rider) {
            await RiderPayout.findByIdAndUpdate(id, { $set: { status: "paid", imageFile } });
        } else if (offlineFarmer) {
            await OfflineFarmerPayout.findByIdAndUpdate(id, { $set: { status: "paid" } }); // ✅ walang imageFile para sa offline farmer
        }

        const date = new Date().toISOString().split("T")[0].replace(/-/g, "");
        const random = Math.floor(10000 + Math.random() * 90000);
        const refNo = `REF${date}-${random}`;

        // ✅ AdminPaymentTransaction — tama na ang fields
        await AdminPaymentTransaction.create({
            accountId: seller?.sellerId ?? rider?.riderId ?? offlineFarmer?.farmerId,
            accountName: seller?.sellerName ?? rider?.riderName ?? offlineFarmer?.farmerName,
            accountEmail: seller?.sellerEmail ?? rider?.riderEmail ?? offlineFarmer?.farmerContact ?? "N/A", // ✅ farmerContact fallback, walang email ang offline farmer
            type: seller ? "seller payout" : rider ? "rider payout" : "offline farmer payout",
            paymentMethod: offlineFarmer ? " cash payout" : seller?.e_WalletAcc?.type, // ✅ offline farmer = cash, seller/rider = gcash
            totalAmount: seller?.totalAmount ?? rider?.totalAmount ?? offlineFarmer?.totalAmount,
            status: "paid",
            paidAt: {
                date: new Date().toISOString().split("T")[0],
                time: new Date().toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", hour12: true })
            },
            refNo,
            imageFile: imageFile ?? null
        });

        // ✅ SellerPaymentTransaction — seller payout lang, hindi para sa offline farmer
        if (seller) {
            await SellerPaymentTransaction.create({
                sellerId: seller.sellerId,
                accountId: seller.sellerId,
                accountName: seller.sellerName,
                accountEmail: seller.sellerEmail,
                type: "seller payout",
                paymentMethod: seller?.e_WalletAcc?.type ?? "gcash",
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


export const getOfflineFarmerPaymentTransactions = async (req, res) => {
    try {
        const { payoutId } = req.query;

        if (!payoutId) {
            return res.status(400).json({ message: "payoutId is required" });
        }

        const transactions = await OfflineFarmerPaymentTransaction.find({ 
            payoutId 
        }).sort({ createdAt: -1 });

        res.status(200).json({
            transactions,
            total: transactions.length,
            totalAmount: transactions.reduce((sum, t) => sum + t.totalAmount, 0)
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


export const getSellerPaymentTransactions = async (req, res) => {
    try {
        const { payoutId } = req.query;

        if (!payoutId) {
            return res.status(400).json({ message: "payoutId is required" });
        }

        const transactions = await SellerPaymentTransaction.find({ 
            payoutId 
        }).sort({ createdAt: -1 });

        res.status(200).json({
            transactions,
            total: transactions.length,
            totalAmount: transactions.reduce((sum, t) => sum + t.totalAmount, 0)
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};