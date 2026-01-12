import jwt from "jsonwebtoken";

const UrlAuthentication = async(req, res) => {

    try{
        const decode = jwt.verify(req.cookies.accessToken, process.env.JWT_SECRET);
        res.status(200).json(decode);
    }catch(err){
        res.status(500).json({ message : err.message});
    }
}
export default UrlAuthentication;