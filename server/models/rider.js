import mongoose from "mongoose";


const riderSchema = new mongoose.Schema({
    accountId: {
        type: String, 
        required: false
    },
    imageFile: {
        type: String, 
        required: false
    },
    firstname: { 
        type: String, 
        required: true 
    },
    middlename: { 
        type: String, 
        required: false 
    },
    lastname: { 
        type: String, 
        required: true 
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
    status: {
        type: String,
        enum: ["offline", "available", "on delivery"],
        default: "offline"  
    },
    createdAt : { type: Date, default : Date.now},
    
    e_WalletAcc: {
        type: { type: String, required: true },
        number: { type: String, required: true}
    },

    riderAddress: {
        province:       { type: String , required: false},
        city:           { type: String , require:  false},
        barangay:       { type: String , required: false},
        detailAddress:  { type: String,  required: false },
        zipCode:        { type: String,  required: false }
    },

    plateNumber: {
        type: String
    },
    imagePlateNumber: {
        type: String
    },

    licenseImage: {
        type: String,
    },
    
    verification: {
        type: String,
        enum:[ 'pending', "verified", 'rejected'],
        default: 'pending'
    },

    pushToken: {
        type: String,
        required: false
    }
});

const Rider = new mongoose.model("Rider", riderSchema);

export default Rider;