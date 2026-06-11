import Chat from "../models/chat.js";
import Messages from "../models/messages.js";




export const unarchiveChat = async (req, res) => {
    try {
        const { id } = req.account;
        const chatId = req.params.id;

        await Chat.updateOne(
            { _id: chatId },
            { $pull: { archivedBy: { accountId: id } } },
            { timestamps: false }
        );

        res.status(200).json({ message: "Chat unarchived" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};



export const archivedChats = async (req, res) => {
    try {
        const { id } = req.account;

        const chats = await Chat.find({
            "participants.accountId": id,
            isEmpty: false,
        })
        .populate({
            path: "participants.accountId",
            select: "firstname lastname email",
        })
        .sort({ updatedAt: -1 });

        const archived = chats.filter((chat) => {
            const entry = chat.archivedBy.find(
                (e) => e.accountId.toString() === id.toString()
            );
            // isang archived lang — pag may bagong message pagkatapos, wala na sa archived
            return entry && chat.updatedAt <= entry.archivedAt;
        });

        if (archived.length === 0) {
            return res.status(404).json({ message: "no archived chats" });
        }

        res.status(200).json(archived);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


export const inboxChats = async(req, res) => {
    try{
        const { id, role } = req.account;
        
        const chats = await Chat.find({
            "participants.accountId": id, 
            isEmpty: false,
        })
        .populate({
            path   : "participants.accountId", 
            select : "firstname lastname email",
        })
        .sort({ updatedAt: -1 });

        const filteredChats = chats.filter((chat) => {
            // existing deletedBy filter
            const deleted = chat.deletedBy.find(
                (e) => e.accountId.toString() === id.toString()
            );
            if (deleted && chat.updatedAt <= deleted.deletedAt) return false;

            // new archivedBy filter
            const archived = chat.archivedBy.find(
                (e) => e.accountId.toString() === id.toString()
            );
            if (!archived) return true;

            // auto-unarchive pag may bagong message pagkatapos ma-archive
            return chat.updatedAt > archived.archivedAt;
        });

        if(filteredChats.length === 0){
            return res.status(404).json({ message : "no messages"});
        }

        res.status(200).json(filteredChats);
    }catch(err){
        res.status(500).json({ message : err.message});
    }
}



export const markAsRead = async(req, res) => {

    try{
        const { role, id } = req.account;
        const chatId = req.params.id;

        
        const chat = await Chat.findById(chatId);
        if (!chat) return res.status(404).json({ message: "Chat not found" });
        
        
        chat.unreadCount[role] = 0;
        chat.markModified("unreadCount");
        await chat.save({ timestamps : false });


        const result = await Messages.updateMany(
            { 
                chatId,
                senderId: { $ne: id },       // huwag markahan yung sarili mong messages
                readBy: { $ne: id }          // huwag mag duplicate entry
            },
            { $push: { readBy: id } }
        );

        if(result.modifiedCount === 0){
            return res.status(404).json({ message : "seen already"});
        }
        
        setTimeout(() => {
            io.emit("markAsRead");
        }, 1500); // 1.5 seconds

        res.status(200).json({ message : `seen message.`});
    }catch(err){
        res.status(500).json({ message : err.message});
    }   
} 



export const deleteChat = async(req, res) => {
    try{
        const chatId  = req.params.id;  
        const {id, role} = req.account;

                    
        const chat = await Chat.findById(chatId);

        if (!chat) {
            return res.status(404).json({ message: "Chat not found" });
        }

        // Check kung naka-delete na dati
        const alreadyDeleted = chat.deletedBy.some((entry) =>
            entry.accountId.toString() === id.toString() 
        );
        
        if(alreadyDeleted) {
            await Chat.updateOne(
                {_id : chatId, "deletedBy.accountId": id},
                {$set : { "deletedBy.$.deletedAt": new Date()}},
                { timestamps: false }
            );
            
        } else {

            chat.deletedBy.push({ 
                accountId: id, 
                role: role.charAt(0).toUpperCase() + role.slice(1),
                deletedAt: new Date()
            });
            
            await chat.save({ timestamps : false });
        }
        
        if(chat.deletedBy.length >= 2){
            await Chat.findByIdAndDelete(chatId);
        }
        
        res.status(200).json({ message : "chat deleted"});
    }catch(err){
        res.status(500).json({ message : err.message});
    }
}




export const archiveChat = async (req, res) => {
    try {
        const chatId = req.params.id;
        const { id, role } = req.account;

        const chat = await Chat.findById(chatId);
        if (!chat) return res.status(404).json({ message: "Chat not found" });

        const alreadyArchived = chat.archivedBy.some(
            (e) => e.accountId.toString() === id.toString()
        );

        if (alreadyArchived) {
            // Update lang yung archivedAt timestamp
            await Chat.updateOne(
                { _id: chatId, "archivedBy.accountId": id },
                { $set: { "archivedBy.$.archivedAt": new Date() } },
                { timestamps: false }
            );
        } else {
            chat.archivedBy.push({
                accountId: id,
                role: role.charAt(0).toUpperCase() + role.slice(1),
                archivedAt: new Date()
            });
            await chat.save({ timestamps: false });
        }

        res.status(200).json({ message: "Chat archived" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};