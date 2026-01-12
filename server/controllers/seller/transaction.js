import SellerPaymentTransaction from "../../models/sellerPaymentTrans.js";
import PayoutTransaction from "../../models/payoutTransaction.js";
import multer from "multer";



export const getSellerTransaction = async (req,  res) => {
    try {
        const { id, role } = req.account;

        const payout = await PayoutTransaction.find({ sellerId: id});
        
        const filteredPayouts = payout.filter((payout) => {
            const deleted = payout.deletedBy.find(
                (e) => e.id.toString() === id.toString() && e.role === role
            );
            return !deleted; // kung wala sa deletedBy, ipakita
        });


        const payment = await SellerPaymentTransaction.find({ sellerId: id });
        const resData = {payout: filteredPayouts , payment};

        res.status(200).json(resData)
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}


export const sellerDeletePayment = async (req, res) => {
    try {   

        const { items } = req.body;

        await SellerPaymentTransaction.deleteMany({_id: { $in: items }});
        
        res.status(200).json({ message: "Successfully Deleted" });;
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}





export const sellerDeletePayout = async ( req, res) => {
    try {
        const { items } = req.body;
        const {id , role } = req.account;


        await PayoutTransaction.updateMany(
            {_id: { $in: items }},
            {
                $addToSet: {
                    deletedBy: {id, role}
                }
            }
        )
        const doubleDeleted = await PayoutTransaction.find({
            _id: { $in: items },
            "deletedBy.role": { $all: ["admin", "seller"] }
        });
        
        if (doubleDeleted.length > 0) {
            const idsToRemove = doubleDeleted.map((item) => item._id);
            await PayoutTransaction.deleteMany({ _id: { $in: idsToRemove } });
        }

        
        res.status(200).json({ message: "succesfuly sent."});
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}




