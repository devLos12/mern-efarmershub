import Order from "../../models/order.js";
import multer from "multer";
import PayoutTransaction from "../../models/payoutTransaction.js";
import AdminPaymentTransaction from "../../models/adminPaymentTrans.js"; 
import Seller from "../../models/seller.js";
import SellerPaymentTransaction from "../../models/sellerPaymentTrans.js";
import Rider from "../../models/rider.js";
import RiderPayout from "../../models/riderPayout.js";




const sendSMS = async (firstname, contact, totalAmount, riderName, riderContact) => {


    const buyer = firstname.charAt(0).toUpperCase() + firstname.slice(1).toLowerCase();
    const rider = riderName.split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) 
    .join(" ");
    const amount = totalAmount.toLocaleString('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

    const message = `E-FARMERS HUB: Hello ${buyer} your order is in transit now. Rider: ${rider}. Contact: ${riderContact}. COD Amount: Php${amount} Pls prepare exact amount. Thank you and be safe!`

    const submitData = {
        "api_token": process.env.SMS_TOKEN,
        "phone_number": contact,
        "message": message
    }

    try {
        const res = await fetch(process.env.IPROG_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(submitData)
        })
        const data = await res.json();

        console.log(data);
        if(!res.ok) throw new Error(data.message);

    } catch (error) {
        console.log("Error: ", error.message);
    }
}



const createTransaction = async(order, receiptFIle) => {

    for (const item of order.orderItems){
        const sellerId = item.seller.id;
        const amount = item.prodPrice * item.quantity;
            
        await SellerPaymentTransaction.create({
            sellerId: sellerId,
            accountId: order.userId,
            accountName: `${order.firstname} ${order.lastname}`,
            accountEmail: order.email,
            type: "customer payment",
            paymentMethod: "cash on delivery",
            totalAmount: amount,
            status: "paid",
            paidAt: { 
                date: new Date().toISOString().split("T")[0],
                time: new Date().toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", hour12: true })
            },
            refNo: order.refNo
        })
    }

    
    await AdminPaymentTransaction.create({
        accountId: order.userId,
        accountName: `${order.firstname} ${order.lastname}`,
        accountEmail: order.email,
        type: "customer payment",
        paymentMethod: "cash on delivery",
        totalAmount: order.totalPrice,
        status: "paid",
        paidAt: { 
            date: new Date().toISOString().split("T")[0],
            time: new Date().toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", hour12: true })
        },
        refNo: order.refNo,
        imageFile: receiptFIle
    })

}


const createOrUpdatePayout = async(items, orderId)=>{

    for (const item of items) {
        const sellerId = item.seller.id;
        const amount = item.prodPrice * item.quantity;
        const today = new Date().toISOString().split("T")[0];

        const payout = await PayoutTransaction.findOne({ sellerId, date: today, status: "pending"})

        if (payout){
            payout.orders.push({
                orderId: orderId,
                amount
            })
            payout.totalAmount += amount;
            await payout.save();

        } else {
            
            const seller = await Seller.findOne({_id: sellerId});


            if(!seller){
                throw new Error("seller not found. product must have an active seller.")
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
                orders: [{ orderId: orderId, amount }],
                totalAmount: amount
            });
        }
    }
}



// NEW: Rider Payout Function with TAX
const createOrUpdateRiderPayout = async(riderId, orderId) => {
    const RIDER_TAX_RATE = parseFloat(process.env.RIDER_TAX_RATE) || 0.05; // 5% tax
    const deliveryFee = parseFloat(process.env.RIDER_GROSS_RATE) || 30; // Fixed ₱30 per delivery (GROSS)
    
    const today = new Date().toISOString().split("T")[0];

    // Check if rider has existing payout for today
    const payout = await RiderPayout.findOne({ riderId, date: today, status: "pending" });

    if (payout) {
        // Update existing payout - simple increment
        const grossAmount = deliveryFee;
        const taxAmount = grossAmount * RIDER_TAX_RATE;
        const netAmount = grossAmount - taxAmount;

        payout.totalDelivery += 1;
        payout.totalAmount += grossAmount; // Accumulate GROSS
        payout.taxAmount += taxAmount; // Accumulate TAX
        payout.netAmount += netAmount; // Accumulate NET
        await payout.save();
        
    } else {
        // Create new payout
        const rider = await Rider.findOne({ _id: riderId });

        if (!rider) {
            throw new Error("Rider not found.");
        }

        const grossAmount = deliveryFee;
        const taxAmount = grossAmount * RIDER_TAX_RATE;
        const netAmount = grossAmount - taxAmount;

        await RiderPayout.create({
            riderId,
            riderName: `${rider.firstname} ${rider.lastname}`,
            riderEmail: rider.email,
            e_WalletAcc: {
                type: rider?.e_WalletAcc?.type,
                number: rider?.e_WalletAcc?.number
            },
            date: today,
            totalDelivery: 1,
            totalAmount: grossAmount, // GROSS total
            taxAmount: taxAmount, // TAX total
            netAmount: netAmount // NET total (actual payout)
        });
    }
}






const storage = multer.diskStorage({
    destination : "./uploads/rider",
    filename :  (req, file, cb) =>{
        const uniqueName = `${Date.now()} - ${file.originalname}`;
        cb(null, uniqueName);
    }
})

export const imageProof = multer({storage: storage});


const updateStatusDelivery = async (req, res) => {
    try {
        const riderId = req.account.id;
        const { id, newStatus } = req.body;
        
        // Get both images if they exist
        const imageFile = req.files?.image ? req.files.image[0].filename : null;
        const paymentReceiptFile = req.files?.paymentReceipt ? req.files.paymentReceipt[0].filename : null;

        const order = await Order.findOne({_id : id})  

        if(newStatus === "in transit"){
            order.statusDelivery = newStatus;
            order.statusHistory.push({
                status: newStatus,
                description: `your order is now ${newStatus}`,
                location: "unknwon",
            })

            const rider = await Rider.findOne({_id: riderId });
            await sendSMS(order.firstname, order.contact, order.totalPrice, order.riderName, rider.contact );
            await order.save();
        } 

        if(newStatus === "delivered"){
            order.statusDelivery = newStatus;
            order.statusHistory.push({
                status: newStatus,
                description: `your order is successfully ${newStatus}`,
                location: "unknwon",
                imageFile: imageFile,
            })

            // Check kung replacement delivery ba ito
            const isReplacementDelivery = order.orderItems.some(item => 
                item.replacement?.isRequested && item.replacement?.status === "approved"
            );

            // Kung HINDI replacement, proceed with payment transactions
            if (!isReplacementDelivery && order.paymentStatus === "pending") {
                order.paymentStatus = "paid";
                await createOrUpdatePayout(order.orderItems, order._id);
                await createTransaction(order, paymentReceiptFile);
            }

                        
            // Rider payout is still created regardless (para sa delivery fee)
            await createOrUpdateRiderPayout(riderId, order._id);
            
            await order.save();
        }

        const resData = {
            message: `Order is now ${newStatus}`, 
            statusHistory: order.statusHistory
        }

        res.status(200).json(resData);
    } catch (error) {
        res.status(500).json({ message: error.message});
    }
}

export default updateStatusDelivery;