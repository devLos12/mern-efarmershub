import mongoose from "mongoose";


const remittanceSchema = new mongoose.Schema({
    orderId: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
        required: true
    },
    riderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Rider",
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'remitted'],
        default: 'pending'
    },
    expectedAmount: {
        type: Number,
        required: true
    },
    remittedAt: Date,
    
    imageFile: {
        type: String, 
    },

    cloudinaryId: {
        type: String,
    }

}, { timestamps: true });



const Remit = mongoose.model("remit", remittanceSchema);

export default Remit;


