import Seller from "../../models/seller.js";
import multer from "multer";



const storage  = multer.diskStorage({
    destination : "./uploads",
    filename :  (req, file, cb) =>{
        const uniqueName = `${Date.now()} - ${file.originalname}`;
        cb(null, uniqueName)
    }
})


export const updateProfile = multer({ storage : storage});


export const UpdateProfile = async(req, res) => {
    try {
        const { id } = req.account;
        const {image, firstname, lastname, email, contact, province, city, barangay, zipCode, detailAddress, 
            wallet_number, wallet_type
        } = req.body;
        const imageFile =  req.file?.filename ?? null;

        
        const updateProfile = await Seller.findOne({_id: id});

        if(!updateProfile){
            return res.status(494).json({ message: "seller not found."});
        }


        if(image === "undefined"){

            await Seller.findByIdAndUpdate(id, 
                {
                    firstname, lastname, email, contact, 
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

                }, {new: true}
            )

        } else {
            
            await Seller.findByIdAndUpdate(id, 
                {
                    imageFile: imageFile ?? image,
                    firstname, lastname, email, contact, 
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
                }, {new: true}
            )

        }


        res.status(200).json({ message: "successfully updated."});
    } catch (error) {
        res.status(500).json({ message: error.message});
        
    }
    
}