import mongoose from "mongoose";


const seasonalAnnouncementSchema = new mongoose.Schema({
    cropName: { 
        type: String, 
        required: true 
    }, 
    title: { 
        type: String, 
        required: true 
    },
    description: { 
        type: String, 
        required: true 
    },
    imageFile: { 
        type: String, 
        required: false
     }, 
    startDate: { 
        type: Date, 
        required: true,
        set: (value)=> new Date(value)        
    },
    endDate: { 
        type: Date, 
        required: true,
        set: (value)=> new Date(value)        
    },


    createdAt: { type: Date, default: Date.now },

    cloudinaryId: { 
        type: String,
        required: false
    }   
})  

const SeasonalAnnouncement = new mongoose.model("seasonalannoucement", seasonalAnnouncementSchema);

export default SeasonalAnnouncement;