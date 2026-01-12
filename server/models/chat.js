import mongoose from "mongoose";


const chatSchema = new mongoose.Schema({
    participants: [
        {
            accountId: {
                type: mongoose.Schema.Types.ObjectId,
                refPath : 'participants.role',
                required: true
            },
            role: {
                type: String,
                enum: ["Admin", "Seller", "User", "Rider"],
                required: true
            }
        }
    ],
    

    lastMessage: {
        type: String,
        default: ""
    },

    lastSender: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
    },

    unreadCount: {
        type : Object,
        default: {}
    },
    isEmpty : {
        type : Boolean,
        default : true
    },

    deletedBy : [{
        accountId : {
            type : mongoose.Schema.Types.ObjectId,
            refPath :'deletedBy.role',
            required : false
        },
        role : {
            type : "String",
            enum : ["Admin", "Seller", "User"],
            required : false
        },
        
        deletedAt : {
            type : Date,
            default : Date.now
        }
    }]
    

}, { timestamps: true });

const Chat = new mongoose.model("Chat", chatSchema);
export default Chat;