import Notification from "../models/notification.js";
import mongoose from "mongoose";




export const adminGetNotification = async (req, res) => {
    try {
        const id = req.account.id;

        const notif = await Notification.find({
            "recipient.id": new mongoose.Types.ObjectId(id),
            "recipient.role": "admin"
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
            "recipient.id": new mongoose.Types.ObjectId(id),
            "recipient.role": "user"
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
            "recipient.id": new mongoose.Types.ObjectId(id),
            "recipient.role": "seller"
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
                { "recipient.role": role }
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




export const deleteNotification = async(req, res) =>{

    try{
        const { id } = req.account;
        const notifId = req.params.id;

        const result = await Notification.findByIdAndDelete(notifId);
        if(!result) {
            return res.status(404).json({ message : "notification not found"});
        }
        
        res.status(200).json({ message: "notification deleted"});
    }catch(err){
        res.status(500).json({ message: err.message});
    }
}