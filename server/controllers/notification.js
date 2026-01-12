import Notification from "../models/notification.js";



export const getNotification = async( req, res) =>{
    try{
        const id = req.account.id;
        
        const notif = await Notification.find( 
            { $or: [
                {"recipient.id" : id }, 
                {"recipient.role" : "all"}
            ]});

        if(!notif || notif.length === 0) {
            return res.status(404).json({ message : "empty notification"});
        }
        
        res.status(200).json(notif);

    }catch(err){
        res.status(500).json({ message : err.message});
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