import Rider from "../../models/rider.js";




export const getProfile = async(req, res) => {
    try {

        const { id } = req.account;
        
        const profile = await Rider.findOne({_id: id});

        if(!profile) {
            return res.status(404).json({ message: "rider not found."});
        }

        res.status(200).json(profile);
    } catch (error) {
        res.status(500).json({ message: error.message});
        
    }
}



export const updateActiveStatus = async(req, res) => {
    try {
        const { id } = req.account;
        const { status } = req.body;

        const updatedStatus = status === "online" ? "available" : status

        await Rider.findOneAndUpdate(
            { _id: id}, 
            { $set: { status: updatedStatus } },
            { new: true }
        );

        res.status(200).json({ message: status});
    } catch (error) {
        res.status(500).json({ message: error.message});        
    }
} 





