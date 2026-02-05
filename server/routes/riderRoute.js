import express from "express";
import loginRider from "../controllers/rider/loginRider.js";
import { allDelivery, riderDeleteOrders }  from "../controllers/rider/allDelivery.js";
import authRiderMiddleWares from "../middlewares/authRider.js";
import updateStatusDelivery, { imageProof } from "../controllers/rider/statusDelivery.js";
import { getProfile, updateActiveStatus } from "../controllers/rider/profile.js";
import updateProfile, { updateRiderProfile } from "../controllers/rider/editprofile.js";
import { getChatId, getMessages, sendImage, sendMessage } from "../controllers/messages.js";
import { inboxChats, markAsRead } from "../controllers/chats.js";
import { riderPayout, deleteRiderPayout } from "../controllers/rider/payouts.js";
import { getQrCodes } from "../controllers/rider/qrpayment.js";


const riderRouter = express.Router();

riderRouter.post("/loginRider", loginRider);
riderRouter.get("/sessionVerify", authRiderMiddleWares);
riderRouter.get("/getProfile", authRiderMiddleWares, getProfile);
riderRouter.patch("/updateProfile", authRiderMiddleWares, updateRiderProfile.single("image"), updateProfile);
riderRouter.patch("/updateActiveStatus", authRiderMiddleWares, updateActiveStatus);
riderRouter.get("/getAllDelivery", authRiderMiddleWares, allDelivery);
riderRouter.patch("/riderDeleteOrders", authRiderMiddleWares, riderDeleteOrders);


riderRouter.patch("/updateRiderStatusDelivery", 
    authRiderMiddleWares, 
    imageProof.fields([
        { name: "image", maxCount: 1 },           // delivery proof
        { name: "paymentReceipt", maxCount: 1 }   // payment receipt
    ]), 
    updateStatusDelivery
);
riderRouter.post('/getRiderChatId', authRiderMiddleWares, getChatId);
riderRouter.get('/getRiderMessages/:id', authRiderMiddleWares, getMessages);
riderRouter.post('/riderSendMessage', authRiderMiddleWares, sendImage.array("images"), sendMessage);
riderRouter.patch('/updateMarkAsReadFromRider/:id', authRiderMiddleWares, markAsRead);
riderRouter.get('/getRiderInboxChat/', authRiderMiddleWares, inboxChats);
riderRouter.get('/getPayouts', authRiderMiddleWares, riderPayout);
riderRouter.patch('/riderDeletePayout', authRiderMiddleWares, deleteRiderPayout);
riderRouter.get('/getRiderQrPayment', authRiderMiddleWares, getQrCodes);



export default riderRouter;