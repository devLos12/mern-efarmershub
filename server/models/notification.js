import mongoose, { Types } from "mongoose";


const notificationSchema = new mongoose.Schema({
    sender : {
        id : {
            type : mongoose.Schema.Types.ObjectId,
            required : false
        },
        role : {
            type : String,
            enum : ["admin", "seller", "user", "system"],
            required : true
        }
    },
    recipient : {
        id  :  { 
            type : mongoose.Schema.Types.ObjectId, 
            refPath : 'role', 
            required : false
        },
        role : { 
            type : String, 
            enum : ["admin", "seller", "user", "all"],
            required : true
        }
    },

    message : {
        type : String,
        required : false
    },

    type : {
        type : String,
        required : false
    },

    isRead: {
        type: Boolean,
        default: false
    },

    readBy: [{
        type: mongoose.Schema.Types.ObjectId,
    }],
    
    link: {
        type : String,
        required : false
    },
    meta : {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }, 
    createdAt: {
        type: Date,
        default: Date.now
    }
})

const Notification = new mongoose.model('Notification', notificationSchema);
export default Notification;