import User from "../../models/user.js";


const postAddress = async(req, res) => {

    try{
        const {userId, firstname, lastname,
            email, contact, province, city, barangay , detailAddress, zipCode
         } = req.body;
         
        const user = await User.findOne({_id : userId});

        if(!user) {
            return res.status(404).json({ message: "User not found." });
        }

        user.billingAddress = {
            firstname, lastname, email, contact, province, city, barangay, detailAddress,
            zipCode
        }

        await user.save();
        
        res.status(200).json({ message : "succesfully updated."});
    }catch(error){
        res.status(500).json({ message : error.message});
    }

}
export default postAddress;