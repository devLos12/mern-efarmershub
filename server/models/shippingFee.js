import mongoose from "mongoose";

const shippingFeeSchema = new mongoose.Schema({
    amount: {
        type: Number,
        required: true,
        default: 60
    },
    surcharges: [
        {
            purok: { type: String, required: true },   // "1", "2", "3", "4", "5", "6"
            additionalFee: { type: Number, default: 0 }
        }
    ],
    updatedBy: {
        type: String,
        default: "admin"
    }
}, { timestamps: true });

const ShippingFee = mongoose.model("ShippingFee", shippingFeeSchema);
export default ShippingFee;