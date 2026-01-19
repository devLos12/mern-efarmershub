import multer from "multer";
import User from "../../models/user.js";
import Product from "../../models/products.js";


// ✅ Import Product model
import { v2 as cloudinary } from "cloudinary";




const storage = multer.memoryStorage();

export const updateProfile = multer({ storage: storage });

export const UpdateProfile = async (req, res) => {

    try {
        const { id } = req.account;
        const {image, firstname, lastname, email, contact, province, city, barangay, zipCode, detailAddress} = req.body;
        
        let imageFileUrl = image;

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
                imageFileUrl = uploadResult.secure_url;
            } catch (uploadError) {
                return res.status(400).json({ message: "Failed to upload image to Cloudinary!" });
            }
        } else if (image === "undefined" || image === "") {
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
                    imageFile: imageFileUrl,
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

            // ✅ UPDATE: I-update din yung user.imageFile sa lahat ng reviews ng user
            await Product.updateMany(
                { "reviews.user.id": id },
                { $set: { "reviews.$[elem].user.imageFile": imageFileUrl } },
                { arrayFilters: [{ "elem.user.id": id }] }
            );
        }

        res.status(200).json({ message: "successfully updated."});
    } catch (error) {
        res.status(500).json({ message: error.message});
    }
}