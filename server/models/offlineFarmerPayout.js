import mongoose from "mongoose";

const offlineFarmerPayoutSchema = new mongoose.Schema({

    payoutNumber: { type: String, unique: true, sparse: true },
    
    farmerId: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: "OfflineFarmer",
        required: true
    },
    
    farmerName: { 
        type: String, 
        required: true 
    },
    
    farmerContact: {
        type: String,
        required: false
    },
    
    date: {
        type: String,
        required: true
    },
    
    orders: [{
        orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
        amount: Number
    }],
    
    totalOrders: {
        type: Number,
        required: false,
        default: 0
    },
    
    totalAmount: {
        type: Number, 
        default: 0
    },
    
    taxAmount: {
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
    
    notes: {
        type: String,
        required: false
    },
    
    createdAt: {
        type: Date,
        default: Date.now
    },
    
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

const OfflineFarmerPayout = mongoose.model("OfflineFarmerPayout", offlineFarmerPayoutSchema);
export default OfflineFarmerPayout;
