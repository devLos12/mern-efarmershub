import { isObjectIdOrHexString } from "mongoose";
import Chat from "../models/chat.js";
import Messages from "../models/messages.js";
import Admin from "../models/admin.js";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";

// Changed to memory storage
const storage = multer.memoryStorage();

export const sendImage = multer({ storage: storage });

export const sendMessage = async (req, res) => {
    try {
        const { id, role } = req.account;
        const { receiverId, receiverRole, textMessage } = req.body;
        const files = req.files;
        
        let imageFiles = [];

        // Upload images to Cloudinary if files exist
        if (files && files.length > 0) {
            const uploadPromises = files.map(async (file) => {
                const base64 = file.buffer.toString('base64');
                const dataURI = `data:${file.mimetype};base64,${base64}`;
                
                const result = await cloudinary.uploader.upload(dataURI, {
                    folder: 'chat-images',
                    secure: true
                });
                
                return result.secure_url;
            });

            imageFiles = await Promise.all(uploadPromises);
        }

        const senderRoleCap = role.charAt(0).toUpperCase() + role.slice(1);
        const receiverRoleCap = receiverRole.charAt(0).toUpperCase() + receiverRole.slice(1);

        let chat = await Chat.findOne({
            "participants.accountId": { $all: [id, receiverId] },
            "participants.role": { $all: [senderRoleCap, receiverRoleCap] },
        });

        if (!chat) return res.status(404).json({ message: "Chat not found." });

        let lastMessage = "";
        if (textMessage && textMessage.trim()) {
            lastMessage = textMessage;
        } else if (imageFiles.length > 0) {
            if (imageFiles.length === 1) {
                lastMessage = "📷 sent photo";
            } else {
                lastMessage = `📷 ${imageFiles.length} photos`;
            }
        }

        chat.lastMessage = lastMessage;
        chat.lastSender = id;
        
        chat.unreadCount[receiverRole] = (chat.unreadCount[receiverRole] || 0) + 1;
        chat.isEmpty = false;
        
        chat.markModified("unreadCount");
        await chat.save();

        const newMessage = new Messages({
            chatId: chat._id,
            senderId: id,
            role: senderRoleCap,
            text: textMessage || "", 
            imageFiles: imageFiles,        
            readBy: [id]
        });

        await newMessage.save();

        io.emit("newChatInbox", { message: "new chat inbox" });
        io.emit("newMessageSent", { message: "new message sent" });
        
        res.status(200).json({ 
            chatId: chat._id,
            senderId: id,
            textMessage: textMessage || "",
            imageFiles: imageFiles,
            time: newMessage.createdAt,
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const getMessages = async (req, res) => {
    try {
        const chatId = req.params.id;
        const { id } = req.account;

        const chatExists = await Chat.findById(chatId);
        if (!chatExists) {
            return res.status(401).json({ message: "This chat no longer exists." });
        }

        const deleted = chatExists.deletedBy.find(
            (e) => e.accountId.toString() === id.toString()
        );
        
        const query = {
            chatId, 
            ...(deleted && { createdAt: { $gt: deleted.deletedAt } })
        };

        const messages = await Messages.find(query);

        if (messages.length === 0) {
            return res.status(404).json({ message: "hi there, do you have concen?" });
        }

        res.status(200).json(messages);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const getChatId = async (req, res) => {
    try {
        const { id, role } = req.account;
        let { receiverId, receiverRole } = req.body;

        let adminEmail; 

        if (receiverId === "unknown" && receiverRole === "admin") {
            const admin = await Admin.findOne({ adminType: { $in: ["main"] } });
            if (!admin) return res.status(404).json({ message: "admin not found." });

            receiverId = admin._id;
            adminEmail = admin.email;
        }

        const senderRoleCap = role.charAt(0).toUpperCase() + role.slice(1);
        const receiverRoleCap = receiverRole.charAt(0).toUpperCase() + receiverRole.slice(1);

        let chat = await Chat.findOne({
            "participants.accountId": { $all: [id, receiverId] },
            "participants.role": { $all: [senderRoleCap, receiverRoleCap] }
        });

        if (!chat) {
            chat = new Chat({
                participants: [
                    { accountId: id, role: senderRoleCap },
                    { accountId: receiverId, role: receiverRoleCap }
                ],
            });
        }

        await chat.save();

        const resdata = {
            chatId: chat._id, 
            senderId: id, 
            receiverId,
            email: adminEmail
        };

        res.status(200).json(resdata);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}