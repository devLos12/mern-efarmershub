import mongoose from "mongoose";


const offlineFarmerSchema = new mongoose.Schema({
    accountId: { 
        type: String,
        required: true
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
        required: true,
    },
    suffix: { 
        type: String,
        required: false,
        default: "N/A" 
    },
    contact: {
        type: String,
        required: false
    },
    
    verification: { type: String, default: "verified" }
}, { timestamps: true });

const OfflineFarmer = mongoose.model("OfflineFarmer", offlineFarmerSchema);
export default OfflineFarmer;


