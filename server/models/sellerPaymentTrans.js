import mongoose from "mongoose";



const sellerPaymentTransactionSchema = new mongoose.Schema({

    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    
    accountId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    accountName: { 
        type: String, 
        required: true
    },
    accountEmail: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        required: true,
    },
    paymentMethod: {
        type: String,
        required: true,
    },
    totalAmount: {
        type: Number,
        required: true,
        default: 0
    },
    status: {
        type: String,
        default: "pending",
        required: false
    },
    refNo: {
        type: String,
        required: false
    },
    paidAt: {
        date: { type: String, required: true},
        time: { type: String, required: true }
    },
    createdAt: {
        type: Date,
        default: Date.now
    }

})


const SellerPaymentTransaction = new mongoose.model("SellerPaymentTransaction", sellerPaymentTransactionSchema);
export default SellerPaymentTransaction;