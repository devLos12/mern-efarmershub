import SeasonalAnnouncement from "../../models/seasonal.js";
import multer from "multer";



const storage  = multer.diskStorage({
    destination : "./uploads",
    filename :  (req, file, cb) =>{
        cb(null, file.originalname)
    }
})

export const uploadAnnouncement = multer({ storage : storage});



export const addAnnouncement = async (req, res) => {

    try {
        const { name, title, description, startDate, endDate } = req.body;
        const imageFile = req.file?.filename ?? null;

        await SeasonalAnnouncement.create({
            cropName: name, title, description, startDate, endDate, imageFile 
        });


        res.status(200).json({ message: "Announcement added successfully."});
    } catch (error) {
        res.status(500).json({ message: error.message });
    }

}


export const getAnnouncement = async(req, res) => {
    try {

        const allAnnoucement = await SeasonalAnnouncement.find();

        if(!allAnnoucement || allAnnoucement.length === 0) {
            return res.status(404).json({ message: "no announcement."});
        }        
        
        res.status(200).json(allAnnoucement);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}


export const editAnnouncement = async (req, res) => {
    try {
        const { id, name, title, description, startDate, endDate, image} = req.body;
        const imageFile = req.file?.filename ?? null;


        await SeasonalAnnouncement.findOneAndUpdate(
            {_id: id}, 
            { $set : { cropName: name, title, description, 
                imageFile: imageFile ?? image, 
                startDate, endDate
             }}
        )

        res.status(200).json({ message: "successfully updated."});
    } catch (error) {
        res.status(500).json({ message: error.message });
        
    }
    
}


export const deleteAnnouncement = async (req, res) => {
    try {
        const { id } = req.params;

        await SeasonalAnnouncement.findOneAndDelete({_id: id});

        res.status(200).json({ message: "Deleted Succesfully."});
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
    
}