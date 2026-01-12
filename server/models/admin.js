import mongoose from "mongoose";

const adminSchema = new mongoose.Schema({
    accountId: {
        type: String,
        required: true,
        unique: true
    },
    contact: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    adminType: {
        type: String,
        enum: ['main', 'sub'],
        default: 'sub'
    }
}, { 
    timestamps: true,
    strict: false 
});

const Admin = mongoose.model('Admin', adminSchema, 'admins');

export default Admin;