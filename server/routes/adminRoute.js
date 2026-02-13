import express from "express";
import { getAccounts, removeAccount, viewProfile, updateVerification } from "../controllers/admin/accounts.js"
import { getProducts, removeProducts } from "../controllers/admin/displayProduct.js";
import {getOrders, removeOrders, archiveOrder, unarchiveOrder, getArchivedOrders} from "../controllers/admin/displayOrder.js";
import updateOrderStatus from "../controllers/admin/updateStatus.js";
import TotalUser from "../controllers/admin/totaluser.js";
import TotalSales from "../controllers/admin/totalsale.js";
import TotalOrders from "../controllers/admin/totalorders.js";
import Logout from "../controllers/admin/logout.js";
import statusApprove from "../controllers/admin/statusApprove.js";
import authMiddleware from "../middlewares/authmiddlewares.js";
import { getNotification } from "../controllers/notification.js";
import getOrderDetails from "../controllers/admin/orderDetails.js";
import getProductsDetails from "../controllers/admin/productDetails.js";
import { getChatId, getMessages, sendImage, sendMessage } from "../controllers/messages.js";
import { inboxChats, markAsRead, deleteChat } from "../controllers/chats.js";
import getRiders from "../controllers/admin/getAvailableRider.js";
import AdminInfo from "../controllers/admin/adminInfo.js";
import { updateCrops, update } from "../controllers/admin/updateCrops.js";
import { deletePayment, deletePayout, payout, transaction, updatePayout } from "../controllers/admin/transaction.js";
import { addAnnouncement, deleteAnnouncement, editAnnouncement, 
getAnnouncement, uploadAnnouncement } from "../controllers/admin/announcement.js";
import trackOrder from "../controllers/trackorder.js";
import { deleteQrCode, getQrCodes, qrCodeFiles, updateQr } from "../controllers/admin/qrcodes.js";
import { uploadRefundFile, updateRefund, rejectRefundFile, rejectRefund } from "../controllers/admin/updateRefund.js";
import addAccount, { addAccountFile } from "../controllers/admin/addAccount.js";
import { getListProducts } from "../controllers/admin/listProductReports.js";
import { cancelOrder, statusOrder, cancelOrderFile, reviewReplacement } from "../controllers/admin/statusOrder.js";
import { getDamageLogs, createDamageLog, updateDamageLog, deleteDamageLogs } from "../controllers/damageLog.js";
import { deleteActivityLogs, getActivityLogs } from "../controllers/admin/activityLogs.js";
import { deleteSales, getSalesData, getSalesGraphData } from "../controllers/admin/salesReport.js";



const adminRouter = express.Router();


adminRouter.get('/getAdminInfo', authMiddleware, AdminInfo);
adminRouter.get('/getAccounts', authMiddleware, getAccounts);
adminRouter.get('/viewProfile/:id', authMiddleware, viewProfile);
adminRouter.put('/updateVerification/:id', authMiddleware, updateVerification);
adminRouter.delete('/removeAccounts/:id', authMiddleware, removeAccount);
adminRouter.get('/getProducts', authMiddleware, getProducts);
adminRouter.get('/getProductDetails/:id', authMiddleware, getProductsDetails);
adminRouter.put('/updateCropsByAdmin', authMiddleware, update.single("image"), updateCrops);
adminRouter.delete('/removeProducts/:id', authMiddleware, removeProducts);

adminRouter.get('/getOrders', authMiddleware, getOrders);

adminRouter.post("/archiveOrder/:id", authMiddleware, archiveOrder);
adminRouter.post("/unarchiveOrder/:id", authMiddleware, unarchiveOrder);
adminRouter.get("/getArchivedOrders", authMiddleware, getArchivedOrders);

adminRouter.get('/trackAdminOrder/:id', authMiddleware, trackOrder);
adminRouter.delete('/deleteAdminOrder/:id', authMiddleware, removeOrders);
adminRouter.get('/getOrderDetails/:id', authMiddleware, getOrderDetails);
adminRouter.get('/getNotification', authMiddleware, getNotification);
// adminRouter.patch('/updateStatus', updateOrderStatus);
adminRouter.patch(`/updateStatusDelivery`, authMiddleware, statusOrder);
adminRouter.patch('/cancelStatusDelivery', authMiddleware,  cancelOrderFile.single('image'), cancelOrder);
adminRouter.get('/availableRider', authMiddleware, getRiders);

adminRouter.get("/totaluser", authMiddleware, TotalUser);


adminRouter.get("/totalsales", authMiddleware, TotalSales);


adminRouter.get("/totalorders", authMiddleware, TotalOrders);


adminRouter.patch("/updateStatusApprove/:id", authMiddleware, statusApprove);
adminRouter.post("/adminSendMessage", sendImage.array("images"), authMiddleware, sendMessage);
adminRouter.get("/getAdminMessages/:id", authMiddleware, getMessages);
adminRouter.get("/getAdminInboxChat", authMiddleware, inboxChats);
adminRouter.patch("/updateMarkAsReadFromAdmin/:id", authMiddleware, markAsRead);
adminRouter.post("/getAdminChatId", authMiddleware, getChatId);
adminRouter.patch("/deleteChatAdmin/:id", authMiddleware, deleteChat);

adminRouter.get("/getTransactions", authMiddleware, transaction);
adminRouter.patch("/updatePayout", authMiddleware, payout.single("image"), updatePayout);
adminRouter.delete("/deletePayment", authMiddleware, deletePayment);
adminRouter.patch("/deletePayout", authMiddleware, deletePayout);
adminRouter.post('/addAnnouncement', authMiddleware, uploadAnnouncement.single("image"), addAnnouncement);
adminRouter.get('/getAnnouncement', authMiddleware, getAnnouncement);
adminRouter.patch('/editAnnouncement', authMiddleware, uploadAnnouncement.single("image"), editAnnouncement);
adminRouter.delete('/deleteAnnouncement/:id', authMiddleware, deleteAnnouncement);
adminRouter.post('/updateQrCodes', authMiddleware, qrCodeFiles, updateQr);
adminRouter.get('/getQrCodes', authMiddleware, getQrCodes);
adminRouter.delete('/deleteQr/:type', authMiddleware, deleteQrCode);
adminRouter.patch('/updateRefundStatus', authMiddleware, uploadRefundFile.single('refundReceipt'),
updateRefund);
adminRouter.patch('/rejectfundStatus', authMiddleware, rejectRefundFile.single('image'), rejectRefund);
adminRouter.post("/add-account/:role", 
    authMiddleware, 
    addAccountFile.fields([
        { name: 'plateImage', maxCount: 1 },
        { name: 'licenseImage', maxCount: 1 }
    ]), 
    addAccount
);
adminRouter.get("/getListProducts", authMiddleware, getListProducts);
adminRouter.patch('/reviewReplacement', authMiddleware, reviewReplacement);

// Damage Log Routes
adminRouter.get('/getDamageLogs', authMiddleware, getDamageLogs);
adminRouter.post('/createDamageLog', authMiddleware, createDamageLog);
adminRouter.patch('/updateDamageLog/:id', authMiddleware, updateDamageLog);
adminRouter.delete('/deleteDamageLogs', authMiddleware, deleteDamageLogs);
adminRouter.get('/getActivityLogs', authMiddleware, getActivityLogs);
adminRouter.delete('/deleteActivityLogs', authMiddleware, deleteActivityLogs);

adminRouter.get('/getSalesData', authMiddleware, getSalesData);
adminRouter.delete('/deleteSales',authMiddleware, deleteSales);
adminRouter.get('/getSalesGraphData', authMiddleware, getSalesGraphData);

adminRouter.get("/logoutAdmin", authMiddleware, Logout);


export default adminRouter;