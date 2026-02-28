import mongoose from "mongoose";


const sellerSchema = new mongoose.Schema({
    accountId: { type: String, required: true},
    imageFile: { type: String, required: false },
    firstname: { type: String, required: true },
    middlename: { type: String, required: false },
    lastname: { type: String, required: true },
    email: { type: String, required: true, unique: true },  
    contact: {type: String, required: false },
    password: { type: String, required: true },
    createdAt : { type: Date, default : Date.now},
    
    e_WalletAcc: {
        type: { type: String, required: true },
        number: { type: String, required: true}
    },

    sellerAddress: {
        province:       { type: String , required: false},
        city:           { type: String , require:  false},
        barangay:       { type: String , required: false},
        detailAddress:  { type: String,  required: false },
        zipCode:        { type: String,  required: false }
    },
    verification: {
        type: String,
        enum:[ 'pending', "verified", 'rejected'],
        default: 'pending'
    }
});

const Seller = new mongoose.model("Seller", sellerSchema);
export default Seller;