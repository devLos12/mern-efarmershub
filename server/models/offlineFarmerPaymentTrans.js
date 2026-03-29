import mongoose from "mongoose";

const offlineFarmerPaymentTransactionSchema = new mongoose.Schema({
    
    payoutId: { type: mongoose.Schema.Types.ObjectId, default: null },

    farmerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "OfflineFarmer",
        required: true,
    },
    
    farmerName: {
        type: String,
        required: true
    },

    farmerContact: {
        type: String,
        required: false
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
});

const OfflineFarmerPaymentTransaction = mongoose.model("OfflineFarmerPaymentTransaction", offlineFarmerPaymentTransactionSchema);

export default OfflineFarmerPaymentTransaction;
