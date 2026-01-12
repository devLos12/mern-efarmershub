import jwt from "jsonwebtoken";


const authRiderMiddleWares  = async (req, res, next) => {
    try{
        const authHeader = req.headers["authorization"];
        const token = authHeader && authHeader.split(" ")[1]; // "Bearer token"

        
        if(!token) {
            return res.status(401).json({ message: "No token provided. Unauthorized!." });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.account = decoded;
        next();
    } catch (error) {
        if( error.name === "TokenExpiredError"){
            return res.status(401).json({ message: "Token Expired!"});

        }
        return res.status(500).json({ message: error.message}); 
        console.log()
    }
}

export default authRiderMiddleWares;