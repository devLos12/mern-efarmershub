import multer from "multer";
import User from "../../models/user.js";


const storage  = multer.diskStorage({
    destination : "./uploads",
    filename :  (req, file, cb) =>{
        const uniqueName = `${Date.now()} - ${file.originalname}`;
        cb(null, uniqueName)
    }
})

export const updateProfile = multer({ storage : storage});

export const UpdateProfile = async (req, res) => {

    try {
        const { id } = req.account;
        const {image, firstname, lastname, email, contact, province, city, barangay, zipCode, detailAddress} = req.body;
        const imageFile = req.file?.filename ?? null;

        const updateProfile = await User.findOne({_id: id});
        if(!updateProfile) {
            return res.status(404).json({ message: "user not found"});
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
                    imageFile: imageFile ?? image,
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

        
        res.status(200).json({ message: "succesfully updated."});
    } catch (error) {
        res.status(500).json({ message: error.message});
    }
}
