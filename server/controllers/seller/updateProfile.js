import Seller from "../../models/seller.js";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";

const storage = multer.memoryStorage();

export const updateProfile = multer({ storage: storage });


export const UpdateProfile = async(req, res) => {
    try {
        const { id } = req.account;
        const { image, firstname, lastname, email, contact, province, city, barangay, zipCode, detailAddress, 
            wallet_number, wallet_type
        } = req.body;
        
        // ✅ Upload image to Cloudinary instead of saving locally
        let imageFileUrl = image; // Keep existing image by default

        const updateProfile = await Seller.findOne({ _id: id });

        if (!updateProfile) {
            return res.status(404).json({ message: "seller not found." });
        }

        // ✅ CHANGE: Upload to Cloudinary if new file is provided
        if (req.file) {
            try {
                const base64Image = req.file.buffer.toString('base64');
                const dataURI = `data:${req.file.mimetype};base64,${base64Image}`;
                
                const uploadResult = await cloudinary.uploader.upload(dataURI, {
                    folder: "seller-profiles",
                    resource_type: "auto"
                });
                imageFileUrl = uploadResult.secure_url; // ✅ Store Cloudinary URL
            } catch (uploadError) {
                return res.status(400).json({ message: "Failed to upload image to Cloudinary!" });
            }
        } else if (image === "undefined" || image === "") {
            // If no new image and user wants to remove it
            imageFileUrl = null;
        }

        // Update seller profile with Cloudinary URL
        await Seller.findByIdAndUpdate(
            id, 
            {
                imageFile: imageFileUrl, // ✅ Store Cloudinary URL instead of filename
                firstname, 
                lastname, 
                email, 
                contact, 
                sellerAddress: {
                    province,
                    city,
                    barangay,
                    zipCode,
                    detailAddress
                },
                e_WalletAcc: {
                    number: wallet_number,
                    type: wallet_type
                }
            }, 
            { new: true }
        );

        res.status(200).json({ message: "successfully updated." });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}