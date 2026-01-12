import express from "express";
import register from "../controllers/home/register.js";
import login from "../controllers/home/login.js";
import UrlAuthentication from "../middlewares/urlAuthentication.js";
import { forgotPassword, verifyCode, changePassword } from "../controllers/home/forgotpassword.js";
import { registrationFile } from "../controllers/home/register.js";
import { getBestSellers, getTopBestSeller } from "../controllers/bestSeller.js";




const homeRouter = express.Router();

homeRouter.get("/urlAuthentication", UrlAuthentication);
homeRouter.post('/register', registrationFile.fields([
    { name: 'plateImage', maxCount: 1 },
    { name: 'licenseImage', maxCount: 1 }
]), register);
homeRouter.post('/login', login);
homeRouter.post('/forgot-password', forgotPassword);
homeRouter.post('/verify-code', verifyCode);
homeRouter.post('/change-password', changePassword);
homeRouter.get("/bestsellers", getBestSellers);

export default homeRouter;


