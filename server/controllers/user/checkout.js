import Order from "../../models/order.js";
import Notification from "../../models/notification.js";
import multer from "multer";
import Product from "../../models/products.js";
import Seller from "../../models/seller.js";
import PayoutTransaction from "../../models/payoutTransaction.js";
import AdminPaymentTransaction from "../../models/adminPaymentTrans.js";
import SellerPaymentTransaction from "../../models/sellerPaymentTrans.js";
import cloudinary from "../../config/cloudinary.js";
import fs from "fs";



const createNotification = async(id, role, orderId) => {
    await Notification.create({
        sender : {
            id : id,
            role : role,
        },
        recipient : {
            id : id,
            role : role,
        },
        message : `order placed succesfully.`,
        link : "orderdetails",
        type : "checkout",
        meta : { orderId }
    }); 
}



const createTransaction = async(items, payment, userId, firstname, lastname, email, totalPrice, refNo) => {
    for (const item of items){
        const sellerId = item.seller.id;
        const amount = item.prodPrice * item.quantity;

        await SellerPaymentTransaction.create({
            sellerId: sellerId,
            accountId: userId,
            accountName: `${firstname} ${lastname}`,
            accountEmail: email,
            type: "customer payment",
            paymentMethod: payment,
            totalAmount: amount,
            status: "paid",
            paidAt: { 
                date: new Date().toISOString().split("T")[0],
                time: new Date().toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", hour12: true })
            },
            refNo: refNo
        })
    }

    await AdminPaymentTransaction.create({
        accountId: userId,
        accountName: `${firstname} ${lastname}`,
        accountEmail: email,
        type: "customer payment",
        paymentMethod: payment,
        totalAmount: totalPrice,
        status: "paid",
        paidAt: { 
            date: new Date().toISOString().split("T")[0],
            time: new Date().toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", hour12: true })
        },
        refNo: refNo
    }) 
}



const createOrUpdatePayout = async(items, newOrder) => {
    for (const item of items) {
        const sellerId = item.seller.id;
        const amount = item.prodPrice * item.quantity;
        const today = new Date().toISOString().split("T")[0];

        const payout = await PayoutTransaction.findOne({ sellerId, date: today, status: "pending"})

        if (payout){
            payout.orders.push({
                orderId: newOrder._id,
                amount
            })
            payout.totalAmount += amount;
            await payout.save();
        } else {
            const seller = await Seller.findOne({_id: sellerId});

            if(!seller){
                throw new Error("seller not found. product must be have an active seller.");
            }

            await PayoutTransaction.create({
                sellerId,
                sellerName: `${seller.firstname} ${seller.lastname}`,
                sellerEmail: seller.email,
                e_WalletAcc: { 
                    type: seller?.e_WalletAcc?.type,
                    number: seller?.e_WalletAcc?.number
                },
                date: today,
                orders: [{ orderId: newOrder._id, amount }],
                totalAmount: amount
            });
        }
    }
}


// Temporary storage - deleted after Cloudinary upload
const storage = multer.memoryStorage();

export const upload = multer({ storage: storage });

export const checkOut = async(req, res) => {
    try {
        const userId = req.account.id;
        const {source, orderMethod, payment, text, totalPrice, shippingFee, finalTotal} = req.body;
        const billingAddress = JSON.parse(req.body.billingAddress);
        const items = JSON.parse(req.body.items);

        const {firstname, lastname, contact, email, province, city, barangay, detailAddress, zipCode} = 
        billingAddress;

        let imageFile = null;
        let cloudinaryId = null;

        // ✅ Upload proof of payment to Cloudinary using memoryStorage buffer
        if (req.file) {
            try {
                const base64Proof = req.file.buffer.toString('base64');
                const dataURIProof = `data:${req.file.mimetype};base64,${base64Proof}`;
                
                const result = await cloudinary.uploader.upload(dataURIProof, {
                    folder: 'proof-of-payment',
                    secure: true
                });
                imageFile = result.secure_url;
                cloudinaryId = result.public_id;
            } catch (uploadError) {
                return res.status(400).json({ message: "Failed to upload proof of payment to Cloudinary!" });
            }
        }
        
        // ✅ Generate date for reference number (YYYYMMDD format)
        const date = new Date().toISOString().split("T")[0].replace(/-/g, ""); // 20260215

        // ✅ Find last order with today's date in refNo to get sequential number
        const lastOrderWithRefNo = await Order.findOne({
            refNo: new RegExp(`^REF${date}-`)
        }).sort({ createdAt: -1 });

        let refSequence = 1;
        if (lastOrderWithRefNo && lastOrderWithRefNo.refNo) {
            const lastSequence = parseInt(lastOrderWithRefNo.refNo.split("-")[1]);
            refSequence = lastSequence + 1;
        }

        const refNo = `REF${date}-${refSequence.toString().padStart(4, "0")}`;

        // ✅ Generate sequential ORDER ID with date (OID + date + sequence)
        const lastOrderWithOID = await Order.findOne({
            orderId: new RegExp(`^OID${date}-`)
        }).sort({ createdAt: -1 });
        
        let oidSequence = 1;
        if (lastOrderWithOID && lastOrderWithOID.orderId) {
            const lastSequence = parseInt(lastOrderWithOID.orderId.split("-")[1]);
            oidSequence = lastSequence + 1;
        }
        
        const newOrderId = `OID${date}-${oidSequence.toString().padStart(4, "0")}`;
        // Example: OID20260215-0001, OID20260215-0002, etc.


        // if user attempt to buy directly.
        if(source === "buy"){
            await Product.updateOne(
                { _id: items[0].prodId},
                { $inc: { stocks : - 1 } }
            );
        }
        
        if(orderMethod === "delivery" && payment === "cash on delivery" ){
            const newOrder = new Order({
                orderId: newOrderId,
                userId, 
                orderItems: items, 
                firstname, 
                lastname, 
                email, 
                contact, 
                address: `${province}, ${city}, ${barangay}, ${detailAddress}, ${zipCode}`,
                totalPrice: finalTotal, 
                orderMethod,
                paymentType: payment,
                paymentStatus: "pending",
                proofOfPayment: {
                    image: "pending",
                    textMessage: "n/a",
                    cloudinaryId: null
                },
                refNo: refNo
            })

            await newOrder.save();
            await createNotification(userId, "user", newOrder._id);
            io.emit("user notif", { message: "new notif"});
            io.emit('new order');

            return res.status(200).json({ message: "placed order succesfully!"});
        }

        if(payment === "gcash" || payment === "maya"){
            const newOrder = new Order({
                orderId: newOrderId,
                userId, 
                orderItems: items, 
                firstname, 
                lastname, 
                email, 
                contact, 
                address: `${province}, ${city}, ${barangay}, ${detailAddress}, ${zipCode}`,
                totalPrice: finalTotal, 
                orderMethod,
                paymentType: payment,
                paymentStatus: "paid",
                proofOfPayment: {
                    image: imageFile,
                    textMessage: text ?? "",
                    cloudinaryId: cloudinaryId
                },
                refNo: refNo
            })

            await newOrder.save();
            await createNotification(userId, "user", newOrder._id);
            io.emit("user notif", { message: "new notif"});
            io.emit('new order');
        
        }

        return res.status(200).json({ message: "placed order succesfully!"});
    } catch(err) {
        return res.status(500).json({ message: err.message});
    }
}