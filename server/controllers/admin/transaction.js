import PayoutTransaction from "../../models/payoutTransaction.js";
import AdminPaymentTransaction from "../../models/adminPaymentTrans.js";
import multer from "multer";
import SellerPaymentTransaction from "../../models/sellerPaymentTrans.js";
import RiderPayout from "../../models/riderPayout.js";
import { v2 as cloudinary } from "cloudinary";



export const transaction = async (req, res) => {
    try {

        const {id, role} = req.account;

        const payout = await PayoutTransaction.find(); 

        const filteredPayouts = payout.filter((payout) => {
            const deleted = payout.deletedBy.find(
                (e) => e.id.toString() === id.toString() && e.role === role
            );
            return !deleted; // kung wala sa deletedBy, ipakita
        });
        

        const riderPayout = await RiderPayout.find(); 

        const filteredRiderPayouts = riderPayout.filter((payout) => {
            const deleted = payout.deletedBy.find(
                (e) => e.id.toString() === id.toString() && e.role === role
            );
            return !deleted; // kung wala sa deletedBy, ipakita
        });
        
        const payment = await AdminPaymentTransaction.find();
        
        const resData = { 
            payout: filteredPayouts,
            payment, 
            riderPayout: filteredRiderPayouts
        } 

        res.status(200).json(resData);
    } catch (error) {
        res.status(500).json({ message: error.message});
    }
}




export const deletePayout = async (req, res) => {
    try {
        const { items } = req.body;
        const { id, role } = req.account;

        if (!items || !Array.isArray(items)) {
            return res.status(400).json({ message: "Invalid items array." });
        }

        // STEP 1: Add deletedBy (soft delete) to BOTH collections
        await PayoutTransaction.updateMany(
            { _id: { $in: items } },
            {
                $addToSet: {
                    deletedBy: { id, role }
                }
            }
        );

        await RiderPayout.updateMany(
            { _id: { $in: items } },
            {
                $addToSet: {
                    deletedBy: { id, role }
                }
            }
        );

        // STEP 2: Find items where BOTH admin + seller have deleted
        const doubleDeletedPayout = await PayoutTransaction.find({
            _id: { $in: items },
            "deletedBy.role": { $all: ["admin", "seller"] }
        });

        const doubleDeletedRider = await RiderPayout.find({
            _id: { $in: items },
            "deletedBy.role": { $all: ["admin", "rider"] }
        });

        // STEP 3: HARD DELETE if both sides deleted
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




export const deletePayment = async(req, res) => {
    try {
        
        const { items } = req.body;

        await AdminPaymentTransaction.deleteMany({_id: {$in: items }})

        res.status(200).json({ message: "successfully deleted" });;
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}


// Change to memory storage for Cloudinary upload
const storage = multer.memoryStorage();
export const payout = multer({ storage: storage });


export const updatePayout = async (req, res) => {
    try {
        const { id } = req.body;
        let imageFile = null;

        // Upload to Cloudinary if file exists
        if (req.file) {
            const base64 = req.file.buffer.toString('base64');
            const dataURI = `data:${req.file.mimetype};base64,${base64}`;
            
            const result = await cloudinary.uploader.upload(dataURI, {
                folder: "payout-receipts"
            });
            
            imageFile = result.secure_url;
        }

        // UPDATE BOTH SELLER & RIDER PAYOUT (one of them will match)
        await PayoutTransaction.findByIdAndUpdate(id, {
            $set: { status: "paid", imageFile }
        });

        await RiderPayout.findByIdAndUpdate(id, {
            $set: { status: "paid", imageFile }
        });

        
        // GET TRANSACTION (seller or rider)
        const seller = await PayoutTransaction.findOne({ _id: id });
        const rider = await RiderPayout.findOne({ _id: id });


        // GENERATE REFERENCE NUMBER
        const date = new Date().toISOString().split("T")[0].replace(/-/g, "");
        const random = Math.floor(10000 + Math.random() * 90000);
        const refNo = `REF${date}-${random}`;

        
        // -------------------------------
        // ALWAYS CREATE ADMIN PAYMENT LOG
        // -------------------------------
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
        

        // -------------------------------------------------
        // ONLY CREATE SELLER PAYMENT LOG IF SELLER PAYOUT
        // -------------------------------------------------
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