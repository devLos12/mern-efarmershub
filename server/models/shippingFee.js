import mongoose from "mongoose";

const shippingFeeSchema = new mongoose.Schema({
    amount: {
        type: Number,
        required: true,
        default: 30
    },
    updatedBy: {
        type: String,
        default: "admin"
    }
}, { timestamps: true });


const ShippingFee = mongoose.model("ShippingFee", shippingFeeSchema);
export default ShippingFee;