import Admin from "../../models/admin.js";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";

const storage = multer.memoryStorage();
export const updateAdminProfile = multer({ storage: storage });



export const UpdateAdminProfile = async (req, res) => {
    try {
        const { id } = req.account;
        const { 
            image, firstname, lastname, email, contact,
            province, city, barangay, zipCode, detailAddress 
        } = req.body;

        
        const admin = await Admin.findById(id);
        if (!admin) {
            return res.status(404).json({ message: "Admin not found." });
        }

        // Handle image upload
        let imageFileUrl = image;

        if (req.file) {
            try {
                const base64Image = req.file.buffer.toString('base64');
                const dataURI = `data:${req.file.mimetype};base64,${base64Image}`;
                const uploadResult = await cloudinary.uploader.upload(dataURI, {
                    folder: "admin-profiles",
                    resource_type: "auto"
                });
                imageFileUrl = uploadResult.secure_url;
            } catch (uploadError) {
                return res.status(400).json({ message: "Failed to upload image to Cloudinary!" });
            }
        } else if (image === "undefined" || image === "null" || image === '') {
            imageFileUrl = null;
        }

        await Admin.findByIdAndUpdate(
            id,
            {
                imageFile: imageFileUrl,
                firstname,
                lastname,
                email,
                contact,
                adminAddress: {
                    province,
                    city,
                    barangay,
                    zipCode,
                    detailAddress
                }
            },
            { new: true }
        );

        res.status(200).json({ message: "Profile updated successfully." });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};