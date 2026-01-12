import jwt from "jsonwebtoken";

const authMiddleware = (req, res, next) =>{

    if(!req.cookies.accessToken || !req.cookies.refreshToken){
        return res.status(401).json({ message : "No Token Provided. Unauthorized Detected!"});
    }

    try{
        const token = req.cookies.accessToken;
        const decoded  = jwt.verify(token, process.env.JWT_SECRET);
        req.account = decoded;
        next();

        
    }catch(error){
        if(error.name === "TokenExpiredError"){
            
            try{
                const refreshToken = req.cookies.refreshToken;
                const decodedRefresh = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

                const newAccessToken = jwt.sign(
                    { id: decodedRefresh.id},
                    process.env.JWT_SECRET,
                    { expiresIn: process.env.JWT_EXPIRES}
                )

                res.cookie("accessToken", newAccessToken, {
                    httpOnly : true,
                    secure: false,
                    path: "/"
                })

                req.user = decodedRefresh;
                return next();


            }catch(refreshError){
                return res.status(403).json({ message : "Invalid RefreshToken. Please try again."});
            }
        }
        return res.status(403).json({ message: "Invalid AccesToken. Please try again." });
    }
}

export default authMiddleware;