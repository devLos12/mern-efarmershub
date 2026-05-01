import mongoose from "mongoose";

const adminSchema = new mongoose.Schema({
    accountId: {
        type: String,
        required: true,
        unique: true
    },
    middlename: { 
        type: String, 
        required: false 
    },
    firstname: {
        type: String,
        default: null
    },
    lastname: {
        type: String,
        default: null
    },
    suffix: { type: String, required: false },
    email: {
        type: String,
        required: true,
        unique: true
    },
    contact: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    imageFile: {
        type: String,
        default: null
    },
    adminType: {
        type: String,
        enum: ['main', 'sub'],
        default: 'sub'
    },
    adminAddress: {
        province: { type: String, default: null },
        city: { type: String, default: null },
        barangay: { type: String, default: null },
        zipCode: { type: String, default: null },
        detailAddress: { type: String, default: null }
    }
}, { 
    timestamps: true 
});

const Admin = mongoose.model('Admin', adminSchema, 'admins');

export default Admin;