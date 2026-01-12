import SeasonalAnnoucement from "../../models/seasonal.js";



export const displayAnnouncement = async(req, res) => {

    try {
        const currentDate = new Date();

        const annoucement = await SeasonalAnnoucement.find({
            startDate: { $lte: currentDate },
            endDate: { $gte: currentDate }
        });


        if(!annoucement || annoucement.length === 0 ){
            return res.status(404).json({ message: "No announcement yet."});
        }
        
        res.status(200).json(annoucement);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }

}