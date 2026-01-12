import Rider from "../../models/rider.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const loginRider = async(req, res) => {
    try {    
        const { email, password } = req.body;

        const rider = await Rider.findOne({ email });

        if(!rider) {
            const errorEmail = {
                message: "invalid email",
                from: "email"
            }
            return res.status(404).json(errorEmail);
        }

        const isMatch = await bcrypt.compare(password, rider.password);

        if(!isMatch) {
            const errorPass = {
                message: "invalid password",
                from: "password"
            }
            return res.status(404).json(errorPass);
        }

        // Check rider verification status
        if (rider.verification === "pending") {
            return res.status(403).json({ 
                message: "Your account is pending verification. Please wait for admin approval. We will send you an email if you are verified thank you.",
                verificationStatus: "pending",
                from: "verification"
            });
        }
        
        if (rider.verification === "rejected") {
            return res.status(403).json({ 
                message: "Your account verification has been rejected. Please contact support.",
                verificationStatus: "rejected",
                from: "verification"
            });
        }


        rider.status = "available";
        await rider.save();
        
        const accessToken = jwt.sign(
            {id: rider._id, role: "rider"},
            process.env.JWT_SECRET, 
            { expiresIn: process.env.JWT_EXPIRES }
        )

        const refreshToken = jwt.sign(
            {id: rider._id, role: "rider"},
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: process.env.JWT_REFRESH_EXPIRES }
        )

        const resData = {
            message: "succesfully login",
            role: "rider",
            accessToken,
            refreshToken
        }
        
        res.status(200).json(resData);

    } catch(error) {
        res.status(500).json({ message: error.message});
    }
}

export default loginRider;