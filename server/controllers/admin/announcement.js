import SeasonalAnnouncement from "../../models/seasonal.js";
import multer from "multer";
import cloudinary from "../../config/cloudinary.js";

// Changed to memory storage
const storage = multer.memoryStorage();

export const uploadAnnouncement = multer({ storage: storage });

export const addAnnouncement = async (req, res) => {
    try {
        const { name, title, description, startDate, endDate } = req.body;
        let imageFile = null;
        let cloudinaryId = null;

        // Upload to Cloudinary if image exists
        if (req.file) {
            // Convert buffer to base64 data URI
            const base64 = req.file.buffer.toString('base64');
            const dataURI = `data:${req.file.mimetype};base64,${base64}`;
            
            const result = await cloudinary.uploader.upload(dataURI, {
                folder: 'announcements',
                secure: true
            });

            imageFile = result.secure_url;
            cloudinaryId = result.public_id;
        }

        await SeasonalAnnouncement.create({
            cropName: name, 
            title, 
            description, 
            startDate, 
            endDate, 
            imageFile,
            cloudinaryId
        });

        res.status(200).json({ message: "Announcement added successfully." });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export const getAnnouncement = async(req, res) => {
    try {
        const allAnnoucement = await SeasonalAnnouncement.find();

        if(!allAnnoucement || allAnnoucement.length === 0) {
            return res.status(404).json({ message: "no announcement." });
        }        
        
        res.status(200).json(allAnnoucement);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export const editAnnouncement = async (req, res) => {
    try {
        const { id, name, title, description, startDate, endDate, image } = req.body;
        
        let imageFile = image; // Keep old image by default
        let newCloudinaryId = null;
        let oldCloudinaryId = null;

        // If new image uploaded
        if (req.file) {
            // Get old cloudinary ID
            const currentAnnouncement = await SeasonalAnnouncement.findById(id).select('cloudinaryId');
            oldCloudinaryId = currentAnnouncement?.cloudinaryId;

            // Convert buffer to base64 data URI
            const base64 = req.file.buffer.toString('base64');
            const dataURI = `data:${req.file.mimetype};base64,${base64}`;
            
            const result = await cloudinary.uploader.upload(dataURI, {
                folder: 'announcements',
                secure: true
            });

            imageFile = result.secure_url;
            newCloudinaryId = result.public_id;
        }

        const updateData = {
            cropName: name, 
            title, 
            description, 
            imageFile, 
            startDate, 
            endDate
        };

        if (newCloudinaryId) {
            updateData.cloudinaryId = newCloudinaryId;
        }

        await SeasonalAnnouncement.findByIdAndUpdate(id, updateData);

        // Delete old Cloudinary image (non-blocking)
        if (oldCloudinaryId) {
            cloudinary.uploader.destroy(oldCloudinaryId).catch(err => 
                console.error('Failed to delete old image:', err)
            );
        }

        res.status(200).json({ message: "Successfully updated." });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export const deleteAnnouncement = async (req, res) => {
    try {
        const { id } = req.params;

        // Get cloudinary ID before deleting
        const announcement = await SeasonalAnnouncement.findById(id).select('cloudinaryId');
        
        // Delete from database
        await SeasonalAnnouncement.findByIdAndDelete(id);

        // Delete from Cloudinary (non-blocking)
        if (announcement?.cloudinaryId) {
            cloudinary.uploader.destroy(announcement.cloudinaryId).catch(err => 
                console.error('Failed to delete image:', err)
            );
        }

        res.status(200).json({ message: "Deleted Successfully." });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}