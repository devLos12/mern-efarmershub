import multer from "multer";
import User from "../../models/user.js";
import { v2 as cloudinary } from "cloudinary";

const storage = multer.memoryStorage();

export const updateProfile = multer({ storage: storage });

export const UpdateProfile = async (req, res) => {

    try {
        const { id } = req.account;
        const {image, firstname, lastname, email, contact, province, city, barangay, zipCode, detailAddress} = req.body;
        
        // ✅ CHANGE: Upload image to Cloudinary instead of saving locally
        let imageFileUrl = image; // Keep existing image by default

        const updateProfile = await User.findOne({_id: id});
        if(!updateProfile) {
            return res.status(404).json({ message: "user not found"});
        }

        // ✅ Upload new image to Cloudinary if provided
        if (req.file) {
            try {
                const base64Image = req.file.buffer.toString('base64');
                const dataURI = `data:${req.file.mimetype};base64,${base64Image}`;
                
                const uploadResult = await cloudinary.uploader.upload(dataURI, {
                    folder: "user-profiles"
                });
                imageFileUrl = uploadResult.secure_url; // ✅ Store Cloudinary URL
            } catch (uploadError) {
                return res.status(400).json({ message: "Failed to upload image to Cloudinary!" });
            }
        } else if (image === "undefined" || image === "") {
            // If no new image and user wants to remove it
            imageFileUrl = null;
        }

        if(image === "undefined"){

            await User.findByIdAndUpdate(id, 
                {
                    firstname, lastname, email, 
                    $set: {
                        'billingAddress.contact': contact,
                        'billingAddress.province': province,
                        'billingAddress.city': city,
                        'billingAddress.barangay': barangay,
                        'billingAddress.zipCode': zipCode,
                        'billingAddress.detailAddress': detailAddress,
                    }
                },{ new: true }
            )   

        } else {
            
            await User.findByIdAndUpdate(id, 
                {
                    imageFile: imageFileUrl, // ✅ Store Cloudinary URL instead of filename
                    firstname, lastname, email, 
                    $set: {
                        'billingAddress.contact': contact,
                        'billingAddress.province': province,
                        'billingAddress.city': city,
                        'billingAddress.barangay': barangay,
                        'billingAddress.zipCode': zipCode,
                        'billingAddress.detailAddress': detailAddress,
                    }
                },{ new: true }
            )   

        }

        
        res.status(200).json({ message: "successfully updated."});
    } catch (error) {
        res.status(500).json({ message: error.message});
    }
}
