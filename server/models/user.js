import mongoose from "mongoose";


const userSchema = new mongoose.Schema({
    accountId: { type: String, required: true},
    imageFile: { type: String, required: false},
    firstname: { type: String, required: true },
    middleName: { type: String, required: false },
    lastname: { type: String, required: true },
    email: { type: String, required: true, unique: true },  
    password: { type: String, required: true },
    createdAt : { type: Date, default : Date.now},
    


    billingAddress : {
        firstname:      { type: String },
        lastname :      { type: String },
        email :         { type: String },
        contact:        { type: String },
        province:       { type: String },
        city:           { type: String },
        barangay:       { type: String },
        detailAddress:  { type: String },
        zipCode:        { type: String }
    },
});

const User = mongoose.model("User", userSchema);

export default User; 


