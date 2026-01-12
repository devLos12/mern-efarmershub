import mongoose from "mongoose";


const payoutTransactionSchema = new mongoose.Schema({
    sellerId: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: "Seller",
        required: true
    },
    sellerName: { 
        type: String, 
        required: true 
    },
    sellerEmail:    { 
        type: String, 
        required: true 
    },
    e_WalletAcc: {
        type: { type: String, required: true },
        number: { type: String, required: true }
    },
    date: {
        type: String,
        required: true
    },
    orders: [{
        orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order"},
        amount: Number
    }],
    totalAmount: {
        type: Number, 
        default: 0
    },
    taxAmount:{
        type: Number,
        default: 0
    },
    netAmount: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ["pending", "paid"],
        default: "pending"
    },

    imageFile : { 
        type: String,
        require: false,
    },

    deletedBy: [{
        id: { 
            type: mongoose.Schema.Types.ObjectId, 
            required: false  
        },
        role: { 
            type: String,
            required: false 
        }
    }],

    createdAt: {
        type: Date,
        default: Date.now
    }
})

const PayoutTransaction= new mongoose.model("payoutTransaction", payoutTransactionSchema);
export default PayoutTransaction; 