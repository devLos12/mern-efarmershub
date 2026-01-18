import Rider from "../../models/rider.js";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";

const storage = multer.memoryStorage();

export const updateRiderProfile = multer({ storage: storage });



const updateProfile = async(req, res) => {
    try {
        const { id } = req.account;
        const { image, firstname, lastname, email, contact, wallet_number, wallet_type } = req.body;

        // ✅ CHANGE: Upload to Cloudinary instead of saving locally
        let imageUrl = image; // Keep existing image by default

        if (req.file) {
            try {
                const base64Image = req.file.buffer.toString('base64');
                const dataURI = `data:${req.file.mimetype};base64,${base64Image}`;
                
                const uploadResult = await cloudinary.uploader.upload(dataURI, {
                    folder: "rider-profiles",
                    resource_type: "auto"
                });
                imageUrl = uploadResult.secure_url; // ✅ Store Cloudinary URL
            } catch (uploadError) {
                return res.status(400).json({ message: "Failed to upload image to Cloudinary!" });
            }
        } else if (image === '') {
            // If no new image and user wants to remove it
            imageUrl = null;
        }

        // Update rider profile with Cloudinary URL
        const updatedRider = await Rider.findOneAndUpdate(
            { _id: id },
            { 
                $set: { 
                    imageFile: imageUrl, // ✅ Store Cloudinary URL instead of filename
                    firstname, 
                    lastname, 
                    email, 
                    contact: wallet_number,
                    e_WalletAcc: {
                        type: wallet_type,
                        number: wallet_number
                    }
                }
            },
            { new: true }
        );

        if (!updatedRider) {
            return res.status(404).json({ message: "Rider not found." });
        }

        return res.status(200).json({
            message: "Profile updated successfully.",
            rider: updatedRider,
        });

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export default updateProfile;