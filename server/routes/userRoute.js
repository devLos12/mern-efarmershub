import express from "express";
import { getUserInfo } from "../controllers/user/profile.js";
import { AllProducts } from "../controllers/user/allproducts.js";
import addItemsToCart from "../controllers/user/addtocart.js";
import displayCart from "../controllers/user/diplaycart.js";
import removeItemFromCart from "../controllers/user/removeitems.js";
import handleQuantity from "../controllers/user/handleQuantity.js";
import submitOrder from "../controllers/user/orderForm .js";
import placeOrderclearCart from "../controllers/user/placeOrderclearCart.js";
import UserOrder from "../controllers/user/userOrder.js";
import authMiddleware from "../middlewares/authmiddlewares.js";
import Logout from "../controllers/user/logout.js";
import trackOrder from "../controllers/trackorder.js";
import handlePaymongoWebhook from "../controllers/user/webhook.js";
import postAddress from "../controllers/user/postAddress.js";
import getCookieIdBillingAddress from "../controllers/user/getCookieIdBillingAddress.js";
import {upload, checkOut} from "../controllers/user/checkout.js";
import getOrderDetails from "../controllers/user/orderDetails.js";
import getProductDetails from "../controllers/user/productDetails.js";
import getBillingAddress from "../controllers/user/getBillingAddress.js";
import { uploadImgReview,  productReview } from "../controllers/user/productReview.js";
import { inboxChats, markAsRead, deleteChat} from "../controllers/chats.js";
import { getMessages, sendMessage, sendImage, getChatId} from "../controllers/messages.js";
import { UpdateProfile, updateProfile } from "../controllers/user/updateProfile.js";
import { displayAnnouncement } from "../controllers/user/annoucement.js";
import { getNotification, readNotification } from "../controllers/notification.js";
import changePassword from "../controllers/user/changepassword.js";
import { cancelOrder, replacementImagesUpload, requestReplacement, uploadRefundFile } from '../controllers/user/cancelOrder.js';
import trackReplacementProduct from "../controllers/trackReplacement.js";



// Add this route




const userRouter = express.Router();



userRouter.get('/getInfo', authMiddleware, getUserInfo);
userRouter.patch('/userUpdateProfile', authMiddleware, updateProfile.single("image"), UpdateProfile);
userRouter.get('/getAllproducts', authMiddleware, AllProducts);
userRouter.get('/getUserProductDetails/:id', getProductDetails);
userRouter.post('/addToCart', authMiddleware, addItemsToCart);
userRouter.get('/displayCart/', authMiddleware, displayCart);
userRouter.delete('/removeItem/:prodId', authMiddleware, removeItemFromCart);
userRouter.post('/reqQuantity/', authMiddleware, handleQuantity);
userRouter.post('/postAddress', postAddress);
userRouter.get('/getBillingAddress', getBillingAddress);
userRouter.post('/submitOrders', submitOrder);
userRouter.get('/getUserOrders', authMiddleware, UserOrder);
userRouter.get('/getUserOrderDetails/:id', getOrderDetails);
userRouter.get('/trackorder/:id', authMiddleware, trackOrder);
userRouter.post('/webhook', handlePaymongoWebhook);
userRouter.get('/getCookieId', getCookieIdBillingAddress);
userRouter.get('/getUserNotification', authMiddleware, getNotification);
userRouter.patch('/userReadNotif/:id', authMiddleware, readNotification);
userRouter.post('/checkout',upload.single("image"), authMiddleware, checkOut);
userRouter.delete('/placeOrderclearCart', authMiddleware, placeOrderclearCart);
userRouter.post('/productReview', uploadImgReview.single("image"), authMiddleware,  productReview);
userRouter.post("/userSendMessage", sendImage.array("images"), authMiddleware, sendMessage);
userRouter.get("/getUserMessages/:id", authMiddleware, getMessages);
userRouter.get('/getUserInboxChat', authMiddleware, inboxChats);
userRouter.patch("/updateMarkAsReadFromUser/:id", authMiddleware, markAsRead);
userRouter.post('/getUserChatId', authMiddleware, getChatId);
userRouter.patch("/deleteChatUser/:id", authMiddleware, deleteChat);
userRouter.get('/displayAnnouncement',  displayAnnouncement);
userRouter.patch('/userChangePassword', authMiddleware, changePassword);
userRouter.post('/cancelOrder/:id', authMiddleware, uploadRefundFile.single("qrCode"), cancelOrder);
userRouter.post("/requestReplacement", authMiddleware, replacementImagesUpload,  requestReplacement);
userRouter.get("/trackReplacement/:orderId/:itemId", authMiddleware, trackReplacementProduct);

userRouter.get('/logoutUser', Logout); 



export default userRouter;