import express from "express";
import getInfo from "../controllers/seller/getInfo.js";
import { uploadProducts, upload  } from "../controllers/seller/uploadProducts.js";
import authMiddleware from "../middlewares/authmiddlewares.js";
import Logout from "../controllers/seller/logout.js";
import { getProducts, removeProducts } from "../controllers/seller/displayProduct.js";
import { displayOrders, deleteOrder, archiveSellerOrder, getArchivedSellerOrders, unarchiveSellerOrder } from "../controllers/seller/displayOrders.js";
import getOrderDetails from "../controllers/seller/orderDetails.js";
import getProductDetails from "../controllers/seller/productDetails.js";
import { getMessages, sendMessage, getChatId, sendImage } from "../controllers/messages.js";
import { inboxChats, markAsRead,  } from "../controllers/chats.js";
import { updateCrops, update } from "../controllers/seller/updateCrops.js";
import { UpdateProfile, updateProfile } from "../controllers/seller/updateProfile.js";
import { getSellerTransaction, sellerDeletePayment, sellerDeletePayout } from "../controllers/seller/transaction.js";
import { getNotification, readNotification } from "../controllers/notification.js";
import trackOrder from "../controllers/trackorder.js";
import changePassword from "../controllers/seller/changepassword.js";





const sellerRouter = express.Router();

sellerRouter.get("/getSellerInfo", authMiddleware, getInfo);
sellerRouter.patch("/sellerUpdateProfile", authMiddleware, updateProfile.single("image"), UpdateProfile)
sellerRouter.post('/uploadCrops', authMiddleware, upload.single("image"), uploadProducts);
sellerRouter.put('/updateCrops', authMiddleware, update.single("image"), updateCrops);
sellerRouter.get("/getSellerProduct/:id", getProducts);
sellerRouter.get("/getSellerProductDetails/:id", getProductDetails);
sellerRouter.delete("/removeSellerCrops/:id", removeProducts);
sellerRouter.get("/getSellerOrders/", authMiddleware, displayOrders);

sellerRouter.post("/archiveSellerOrder/:id", authMiddleware, archiveSellerOrder);
sellerRouter.post("/unarchiveSellerOrder/:id", authMiddleware, unarchiveSellerOrder);
sellerRouter.get("/getArchivedSellerOrders", authMiddleware, getArchivedSellerOrders);


sellerRouter.patch("/deleteSellerOrder/:id", authMiddleware, deleteOrder);
sellerRouter.get("/getSellerOrderDetails/:id", authMiddleware, getOrderDetails);
sellerRouter.get("/trackSellerOrder/:id", authMiddleware, trackOrder);
sellerRouter.get("/getSellerNotification", authMiddleware, getNotification);
sellerRouter.patch("/sellerReadNotif/:id", authMiddleware, readNotification);
sellerRouter.post("/sellerSendMessage", sendImage.array("images"), authMiddleware, sendMessage);
sellerRouter.get("/getSellerMessages/:id", authMiddleware, getMessages);
sellerRouter.get("/getSellerInboxChat", authMiddleware, inboxChats);
sellerRouter.patch("/updateMarkAsReadFromSeller/:id", authMiddleware, markAsRead);
sellerRouter.post("/getSellerChatId", authMiddleware, getChatId);
sellerRouter.get('/getSellerTransactions', authMiddleware, getSellerTransaction);
sellerRouter.delete('/sellerDeletePayment', authMiddleware, sellerDeletePayment);
sellerRouter.patch("/sellerDeletePayout", authMiddleware, sellerDeletePayout);
sellerRouter.patch('/sellerChangePassword', authMiddleware, changePassword);
sellerRouter.get("/logoutSeller", Logout);


export default sellerRouter;








