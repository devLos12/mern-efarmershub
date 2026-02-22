import mongoose from "mongoose";


const riderPayout = new mongoose.Schema({
    riderId: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: "Rider",
        required: true
    },
    riderName: { 
        type: String, 
        required: true 
    },
    riderEmail:    { 
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
    totalDelivery: {
        type: Number,
        required: true
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

const RiderPayout= new mongoose.model("RiderPayout", riderPayout);
export default RiderPayout; 