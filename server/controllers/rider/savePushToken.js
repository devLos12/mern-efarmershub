import Rider from '../../models/rider.js';


const savePushToken = async (req, res) => {
    try {
        const { riderId, token } = req.body;

        
        if (!riderId || !token) {
            return res.status(400).json({ message: "riderId and token are required" });
        }

        await Rider.findByIdAndUpdate(riderId, { pushToken: token });

        res.status(200).json({ message: "Push token saved successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export default savePushToken;