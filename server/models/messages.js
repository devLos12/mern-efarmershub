import mongoose from "mongoose";


const messageSchema = new mongoose.Schema({

    chatId : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "Chat",
        required : true
    },

    senderId : {
        type : String, 
        required : true
    },

    role : {
        type : String, 
        enum : ["Admin", "Seller", "User", "Rider"],
        required : true,
    },

    text : {
        type : String,
        required : false
    },

    imageFiles : [{
        type : String,
        required : false
    }],

    readBy : [{
        type : mongoose.Schema.Types.ObjectId
    }]

}, { timestamps : true });



const Messages = new mongoose.model("Message", messageSchema);
export default Messages;
