import mongoose from 'mongoose';

const qrCodeSchema = new mongoose.Schema({
    paymentMethod: {
        type: String,
        enum: ['gcash', 'maya'],
        required: true,
        unique: true // Only one document per payment method
    },
    imageUrl: {
        type: String,
        default: null
    }
}, {
    timestamps: true
});

const QrCode = mongoose.model('QrCode', qrCodeSchema);

export default QrCode;