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
const storage = multer.diskStorage({
    destination: "./uploads",
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${file.originalname}`;
        cb(null, uniqueName);
    }
});


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

        // Upload proof of payment to Cloudinary if image exists
        if (req.file) {
            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: 'proof-of-payment',
                secure: true
            });
            imageFile = result.secure_url;
            cloudinaryId = result.public_id;
            // Delete local file after upload
            fs.unlinkSync(req.file.path);
        }
        
        // Generate date for reference number
        const date = new Date().toISOString().split("T")[0].replace(/-/g, ""); // 20251211

        // Find last order with today's date in refNo to get sequential number
        const lastOrderWithRefNo = await Order.findOne({
            refNo: new RegExp(`^REF${date}-`)
        }).sort({ createdAt: -1 });

        let sequenceNumber = 1;
        if (lastOrderWithRefNo && lastOrderWithRefNo.refNo) {
            const lastSequence = parseInt(lastOrderWithRefNo.refNo.split("-")[1]);
            sequenceNumber = lastSequence + 1;
        }

        const refNo = `REF${date}-${sequenceNumber.toString().padStart(4, "0")}`;

        // if user attempt to buy directly.
        if(source === "buy"){
            await Product.updateOne(
                { _id: items[0].prodId},
                { $inc: { stocks : - 1 } }
            );
        }
        
        // Generate sequential order ID
        const lastOrder = await Order.findOne().sort({ createdAt: -1 });
        
        let newOrderId = "OID0001";

        if (lastOrder && lastOrder.orderId) {
            const lastNumber = parseInt(lastOrder.orderId.replace("OID", "")); // OID0001 -> 1
            const nextNumber = lastNumber + 1;
            newOrderId = "OID" + nextNumber.toString().padStart(4, "0"); // OID0002
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
                    textMessage: text,
                    cloudinaryId: cloudinaryId
                },
                refNo: refNo
            })

            await newOrder.save();
            await createNotification(userId, "user", newOrder._id);
            io.emit("user notif", { message: "new notif"});
            io.emit('new order');

            return res.status(200).json({ message: "placed order succesfully!"});
        }

    } catch(err) {
        // Cleanup uploaded file on error
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ message: err.message});
    }
}