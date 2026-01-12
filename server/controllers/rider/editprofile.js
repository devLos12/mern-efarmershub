import Rider from "../../models/rider.js";
import multer from "multer";


const storage  = multer.diskStorage({
    destination : "./uploads",
    filename :  (req, file, cb) =>{
        const uniqueName = `${Date.now()} - ${file.originalname}`;
        cb(null, uniqueName)
    }
})

export const updateRiderProfile = multer({ storage : storage});



const updateProfile = async(req, res) => {

    try {

        const { id } = req.account;
        const {image, firstname, lastname, email, contact, wallet_number, wallet_type} = req.body;
        const imageFile = req.file?.filename ?? null;


        let updatedRider = null;

        if( image === ''){

            updatedRider = await Rider.findOneAndUpdate(
                {_id: id},
                { $set: { firstname, lastname, email, 
                    contact: wallet_number,
                    e_WalletAcc: {
                        type: wallet_type,
                        number: wallet_number
                    }
                 }},
                { new: true}
            )

        } else {
            
            updatedRider = await Rider.findOneAndUpdate(
                {_id: id},
                { $set: { imageFile: imageFile ?? image, firstname, lastname, email, 
                    contact: wallet_number , 
                    e_WalletAcc: {
                        type: wallet_type,
                        number: wallet_number
                    }
                 }},
                { new: true}
            )
        }

        if (!updatedRider) {
            return res.status(404).json({ message: "Rider not found." });
        }

        res.status(200).json({
            message: "Profile updated successfully.",
            rider: updatedRider,
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }

}

export default updateProfile;