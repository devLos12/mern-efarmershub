import mongoose from "mongoose";

const salesListSchema = new mongoose.Schema({
    saleId: {
        type: String,
        unique: true,
        required: true
    },
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    customerName: {
        type: String,
        required: true
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
    },
    category: { 
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    totalAmount: {
        type: Number,
        required: true,
        min: 0
    },
    paymentMethod: {
        type: String,
        enum: ["gcash", "maya", "cash on delivery"],
        required: true
    },
    status: {
        type: String,
        enum: ['paid', 'pending'],
        default: 'pending',
        required: true
    },
    saleDate: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

const SalesList = mongoose.model("SalesList", salesListSchema);
export default SalesList;