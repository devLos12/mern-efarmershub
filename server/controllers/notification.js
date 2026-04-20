import Notification from "../models/notification.js";
import mongoose from "mongoose";



export const adminGetNotification = async (req, res) => {
    try {
        const id = req.account.id;

        const notif = await Notification.find({
            $or: [
                { "recipient.id": new mongoose.Types.ObjectId(id) },
                { "recipient.role": "admin" },
                { 
                    "recipient.role": "all",
                }
            ]
        }).sort({ createdAt: -1 });

        if (!notif || notif.length === 0) {
            return res.status(404).json({ message: "empty notification" });
        }

        const result = notif.map(n => ({
            ...n.toObject(),
            isRead: n.readBy.includes(id)
        }));

        res.status(200).json(result);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}



export const userGetNotification = async (req, res) => {
    try {
        const id = req.account.id;

        const notif = await Notification.find({
            $or: [
                { "recipient.id": new mongoose.Types.ObjectId(id) },
                { "recipient.role": "user" },
                { "recipient.role": "all" } // lahat ng all, kasama system notice
            ]
        }).sort({ createdAt: -1 });

        if (!notif || notif.length === 0) {
            return res.status(404).json({ message: "empty notification" });
        }

        const result = notif.map(n => ({
            ...n.toObject(),
            isRead: n.readBy.includes(id)
        }));

        res.status(200).json(result);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}


export const sellerGetNotification = async (req, res) => {
    try {
        const id = req.account.id;

        const notif = await Notification.find({
            $or: [
                { "recipient.id": new mongoose.Types.ObjectId(id) },
                { "recipient.role": "seller" },
                { 
                    "recipient.role": "all",
                    "meta.sellerId": new mongoose.Types.ObjectId(id) // sariling system notice lang
                },
                {
                    "recipient.role": "all",
                    "meta.sellerId": { $exists: false } // truly global notifs
                }
            ]
        }).sort({ createdAt: -1 });

        if (!notif || notif.length === 0) {
            return res.status(404).json({ message: "empty notification" });
        }

        const result = notif.map(n => ({
            ...n.toObject(),
            isRead: n.readBy.includes(id)
        }));

        res.status(200).json(result);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}




export const getNotification = async (req, res) => {
    try {
        const id = req.account.id;
        const role = req.account.role;

        const notif = await Notification.find({
            $or: [
                { "recipient.id": id },
                { "recipient.role": role },
                { 
                    "recipient.role": "all",
                    "meta.sellerId": new mongoose.Types.ObjectId(id) // seller-specific "all" notifs
                },
                {
                    "recipient.role": "all",
                    "meta.sellerId": { $exists: false } // truly global, walang sellerId
                }
            ]
        });

        if (!notif || notif.length === 0) {
            return res.status(404).json({ message: "empty notification" });
        }

        const result = notif.map(n => ({
            ...n.toObject(),
            isRead: n.readBy.includes(id)
        }));

        res.status(200).json(result);

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}


export const readNotification = async(req, res) =>{

    try{
        const { id } = req.account;
        const notifId = req.params.id;

        const notif = await Notification.findById(notifId);
        if(!notif) {
            return res.status(404).json({ message : "update error"});
        }
        notif.readBy.push(id);
        notif.isRead = true;
        await notif.save();     

        res.status(200).json({ message: "marked as read"});
    }catch(err){
        res.status(500).json({ message: err.message});
    }
}