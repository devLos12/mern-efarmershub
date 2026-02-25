import Order from "../../models/order.js";
import Seller from "../../models/seller.js";
import Product from "../../models/products.js";
import ActivityLog from "../../models/activityLogs.js";
import Admin from "../../models/admin.js";
import multer from "multer";
import PayoutTransaction from "../../models/payoutTransaction.js";
import AdminPaymentTransaction from "../../models/adminPaymentTrans.js";
import SellerPaymentTransaction from "../../models/sellerPaymentTrans.js";
import Notification from "../../models/notification.js";
import DamageLog from "../../models/damageLog.js";
import { v2 as cloudinary } from "cloudinary";
import SalesList from "../../models/salesReport.js";
import Rider from "../../models/rider.js";





const sendSMS = async (contact, orderId, firstname, productList, totalAmount) => {
    const id = orderId.toString().slice(0, 12);
    const seller = firstname.charAt(0).toUpperCase() + firstname.slice(1).toLowerCase();
    const amount = totalAmount.toLocaleString('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

  const message = `Hello Seller ${seller}!, You have new order #${id}, Please prepare: ${productList}, With Total amount of Php${amount}. IMPORTANT REMINDER: Please ensure all products are fresh and good quality. Do not pack spoiled or damaged items.`;

    const submitData = {
        "api_token": process.env.SMS_TOKEN,
        "phone_number": contact,
        "message": message,
    }
    
    try {
        const res = await fetch(process.env.IPROG_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(submitData)
        })
        const data = await res.json();
        if(!res.ok) throw new Error(data.message);

        
        console.log(data);
    } catch (error) {
        console.log("Error: ", error.message);
    }
}

const formatTime = () =>
    new Date().toLocaleTimeString("en-PH", {
      timeZone: "Asia/Manila",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });



// Helper function to create activity log (success only)
const createActivityLog = async (adminId, action, description, req) => {
    try {
        // Find admin to get admin type
        const admin = await Admin.findById(adminId);
        if (!admin) {
            console.error('Admin not found for activity log');
            return;
        }

        const ipAddress = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
                         req.ip || 
                         req.connection?.remoteAddress;
        const userAgent = req.get('user-agent');

        await ActivityLog.create({
            performedBy: adminId,
            adminType: admin.adminType,
            action: action,
            description: description,
            ipAddress: ipAddress,
            userAgent: userAgent,
            status: 'success'
        });
    } catch (error) {
        console.error('Failed to create activity log:', error);
    }
};


const createTransaction = async(items, payment, userId, firstname, lastname, email, totalPrice, refNo, proofOfPayment) => {

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
            refNo: refNo,
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
        refNo: refNo,
        imageFile: proofOfPayment,

    }) 
}




const createOrUpdatePayout = async(items, order)=>{
    const SELLER_TAX_RATE = process.env.SELLER_TAX_RATE; // 5% tax (adjust mo if needed)


    for (const item of items) {
        const sellerId = item.seller.id;
        const grossAmount = item.prodPrice * item.quantity; // GROSS
        const taxAmount = grossAmount * SELLER_TAX_RATE; // TAX (5%)
        const netAmount = grossAmount - taxAmount; // NET (what seller receives)
        
        const today = new Date().toISOString().split("T")[0];

        const payout = await PayoutTransaction.findOne({ sellerId, date: today, status: "pending"})

        if (payout){
            // UPDATE existing payout - accumulate all amounts
            payout.orders.push({
                orderId: order._id,
                amount: grossAmount // Store gross amount in order
            })
            
            payout.totalAmount += grossAmount; // Accumulate GROSS
            payout.taxAmount += taxAmount; // Accumulate TAX
            payout.netAmount += netAmount; // Accumulate NET
            await payout.save();

        } else {
            // CREATE new payout
            const seller = await Seller.findOne({_id: sellerId});

            if(!seller){
                throw new Error("Seller not found. Product must have an active seller.");
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
                orders: [{ orderId: order._id, amount: grossAmount }],
                totalAmount: grossAmount, // GROSS total
                taxAmount: taxAmount, // TAX total
                netAmount: netAmount // NET total (actual payout)
            });
        }
    }
}






export const statusOrder = async(req, res) => {
    try {
        const {orderId, newStatus, assignRider} = req.body;
        const adminId = req.account.id;

        const order = await Order.findById(orderId);
        

        if(!order) {
            return res.status(404).json({ message: "Order not found" });
        }
        
        const orderIdShort = order.orderId || orderId.toString().slice(-8);


        if(newStatus === "confirm" || newStatus === "packing") {
            const descriptionMess = newStatus === "confirm"
                ? "order confirmed, waiting for process."
                : "your order is now process.";
             
            

            order.statusDelivery = newStatus;
            order.statusHistory.push({
                status: newStatus,
                description: descriptionMess,
                location: "unknown",
                timestamp: formatTime()
            });

            if(newStatus === "confirm") {

                // CREATE PAYMENT AND PAYOUT TRANSACTIONS WHEN ORDER IS CONFIRMED
                if(order.paymentType === "gcash" || order.paymentType === "maya") {
                    await createOrUpdatePayout(order.orderItems, order);
                    
                    await createTransaction(
                        order.orderItems, 
                        order.paymentType, 
                        order.userId, 
                        order.firstname, 
                        order.lastname, 
                        order.email, 
                        order.totalPrice, 
                        order.refNo,
                        order.proofOfPayment.image,
                    );



                    // ========================================
                    // CREATE SALES LIST ENTRIES
                    // ========================================
                
                    try {

                        for (const item of order.orderItems) {
                            const product = await Product.findById(item.prodId);
                            
                            // MANUALLY GENERATE SALEID
                            let newSaleId;
                            const lastSale = await SalesList.findOne().sort({ saleId: -1 });
                            
                            if (lastSale && lastSale.saleId) {
                                const lastNumber = parseInt(lastSale.saleId.substring(1));
                                const newNumber = lastNumber + 1;
                                newSaleId = 'S' + String(newNumber).padStart(4, '0');
                            } else {
                                newSaleId = 'S0001';
                            }
                            
                            const salesRecord = new SalesList({
                                saleId: newSaleId,
                                orderId: order._id,
                                customerName: `${order.firstname} ${order.lastname}`,
                                productId: product?._id,
                                category: product?.category || "Uncategorized",
                                quantity: item.quantity,
                                price: item.prodPrice,
                                totalAmount: item.prodPrice * item.quantity,
                                paymentMethod: order.paymentType.toLowerCase(),
                                status: "paid",
                                saleDate: new Date()
                            });  

                            await salesRecord.save();
                        }
                        
                    } catch (salesError) {
                        return res.status(500).json({ message: "Error creating sales list" });
                    }
                }

                


                
                // GROUP ITEMS BY SELLER
                const sellerGroups = {};
                
                for(const item of order.orderItems) {
                    const sellerId = item.seller.id;
                    
                    if(!sellerGroups[sellerId]) {
                        sellerGroups[sellerId] = {
                            sellerName: item.seller.name,
                            items: [],
                            totalAmount: 0
                        };
                    }
                    
                    sellerGroups[sellerId].items.push({
                        prodName: item.prodName,
                        quantity: item.quantity,
                        price: item.prodPrice
                    });
                    
                    sellerGroups[sellerId].totalAmount += (item.prodPrice * item.quantity);
                }
                
                // SEND SMS TO SELLERS (ONE MESSAGE PER SELLER)
                for(const sellerId in sellerGroups) {
                    const seller = await Seller.findById(sellerId);
                    if(!seller) {
                        console.log(`Seller ${sellerId} not found`);
                        continue;
                    }
                    
                    const sellerContact = seller.e_WalletAcc?.number;
                    const { items, totalAmount } = sellerGroups[sellerId];
                    
                    // Build product list string
                    const productList = items.map(item => 
                        `${item.prodName} (${item.quantity} bundle${item.quantity > 1 ? 's' : ''})`
                    ).join(', ');
                    

                    // Send SMS with all products in one message
                    await sendSMS(sellerContact, order.orderId, seller.firstname, productList, totalAmount);
                }
            }
            await order.save();
            


            // Log activity
            // const actionDesc = newStatus === "confirm" 
            //     ? `Confirmed order #${orderIdShort} and notified ${order.orderItems.length} seller(s) via SMS`
            //     : `Updated order #${orderIdShort} status to packing`;

            // await createActivityLog(
            //     adminId,
            //     'UPDATE ORDER STATUS',
            //     actionDesc,
            //     req
            // );
        }
        
        if((order.orderMethod === "pick up" && newStatus === "ready for pick up") || newStatus === "completed") {
            const descriptionMess = newStatus === "ready for pick up"
                ? "your order is packed and ready for pick up"
                : "order picked up successfully.";

            order.statusDelivery = newStatus;
            order.statusHistory.push({
                status: newStatus,
                description: descriptionMess,
                location: "unknown",
                timestamp: formatTime()
            });
            await order.save();

            // Log activity
            const actionDesc = newStatus === "ready for pick up"
                ? `Marked order #${orderIdShort} as ready for pick up`
                : `Completed order #${orderIdShort} - Customer picked up`;

            await createActivityLog(
                adminId,
                'UPDATE ORDER STATUS',
                actionDesc,
                req
            );
        }





        if(order.orderMethod === "delivery" && newStatus === "ready to deliver") {





            order.statusDelivery = newStatus;
            order.statusHistory.push({
                status: newStatus,
                description: "your order is packed and ready to deliver",
                location: "unknown",
                timestamp: formatTime()
            });
            order.riderId = assignRider?.id;
            order.riderName = assignRider?.name;
            await order.save();

            //Log activity
            await createActivityLog(
                adminId,
                'ASSIGN RIDER TO ORDER',
                `Assigned rider ${assignRider?.name} to order #${orderIdShort} for delivery`,
                req
            );

            const rider = await Rider.findById(assignRider?.id);

            if(rider?.pushToken) {
                const response = await fetch('https://exp.host/--/api/v2/push/send', {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        to: rider.pushToken,
                        sound: 'default',
                        title: '🚀 New Delivery Assigned!',
                        body: `Order #${orderIdShort} is ready to deliver.`,
                        data: { orderId: order._id.toString() }
                    })
                });
                const data = await response.json();
                console.log('Expo push response:', data);
            }
        }
        
        
        res.status(200).json({ message: `update your status as ${newStatus}`});
    } catch (error) {
        console.error('Status order error:', error);
        res.status(500).json({ message: error.message});
    }
}







const storage = multer.memoryStorage();

export const cancelOrderFile = multer({ storage: storage });


export const cancelOrder = async (req, res) => {
    try {
        const { orderId, reason, newStatus } = req.body;
        const adminId = req.account.id;


        // Validate required fields
        if (!orderId || !reason || !reason.trim()) {
            return res.status(400).json({ message: "Order ID and reason are required" });
        }

        const order = await Order.findById(orderId);
        
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        const orderIdShort = order.orderId || orderId.toString().slice(-8);

        // ✅ CHANGE: Upload proof image to Cloudinary instead of saving locally
        let proofImageUrl = null;
        
        if (req.file) {
            try {
                const base64Proof = req.file.buffer.toString('base64');
                const dataURIProof = `data:${req.file.mimetype};base64,${base64Proof}`;
                
                const proofResult = await cloudinary.uploader.upload(dataURIProof, {
                    folder: 'order-cancellations/proofs'
                });
                proofImageUrl = proofResult.secure_url;
            } catch (uploadError) {
                return res.status(400).json({ message: "Failed to upload proof image to Cloudinary!" });
            }
        }

        // Update order status to cancelled
        order.statusDelivery = newStatus;
        
        // Add to status history with cancellation details
        order.statusHistory.push({
            status: newStatus,
            description: `Order cancelled by admin. Reason: ${reason}`,
            location: "Admin Office",
            imageFile: proofImageUrl, // ✅ Store Cloudinary URL instead of filename
            timestamp: formatTime()
        });

        // Restore product stocks
        let restoredProducts = 0;
        for (const prod of order.orderItems) {
            const prodId = prod.prodId;
            const quantity = prod.quantity;

            await Product.findByIdAndUpdate(
                prodId,
                { $inc: { stocks: quantity } }
            );
            restoredProducts++;
        }

        await order.save();

        // Log activity (success only)
        const proofText = proofImageUrl ? ' with proof attached' : '';
        await createActivityLog(
            adminId,
            'CANCEL ORDER',
            `Cancelled order #${orderIdShort}${proofText}. Reason: ${reason.substring(0, 50)}${reason.length > 50 ? '...' : ''}. Restored ${restoredProducts} product stock(s)`,
            req
        );

        return res.status(200).json({ message: "Order cancelled successfully" });

    } catch (error) {
        console.error("Cancel order error:", error);
        return res.status(500).json({ message: error.message });
    }
};






const createNotification = async(senderId, senderRole, recipientId, recipientRole, message, link, type, meta) => {
    await Notification.create({
        sender: {
            id: senderId,
            role: senderRole,
        },
        recipient: {
            id: recipientId,
            role: recipientRole,
        },
        message: message,
        link: link,
        type: type,
        meta: meta
    }); 
}



const sendReplacementSMS = async (contact, firstname, orderId, productList, faultAssignedTo) => {
    const id = orderId.toString().slice(0, 12);
    const seller = firstname.charAt(0).toUpperCase() + firstname.slice(1).toLowerCase();
    
    let message = "";
    
    if (faultAssignedTo === "rider") {
        // Neutral - no charge
        message = `E-FARMERS HUB: Hello Seller ${seller}! Replacement needed for Order #${id}: ${productList}. Please prepare the replacement. Thank you!`;
    } else if (faultAssignedTo === "seller") {
        // With ₱30 charge
        message = `E-FARMERS HUB: Hello Seller ${seller}! Replacement approved for Order #${id}: ${productList}. Delivery Charge: ₱30 (deducted from payout). Please prepare the replacement. Thank you!`;
    }


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
        if(!res.ok) throw new Error(data.message);

    } catch (error) {
        console.log("Error: ", error.message);
    }
}




export const reviewReplacement = async (req, res) => {
    try {
        const { orderId, reviewItems } = req.body;
        const adminId = req.account.id;

        const order = await Order.findById(orderId);
        
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        const admin = await Admin.findById(adminId);
        const adminName = admin ? `${admin.firstname} ${admin.lastname}` : "Admin";

        let approvedCount = 0;
        let rejectedCount = 0;

        const buyerId = order.userId;
        const orderIdShort = order.orderId || orderId.toString().slice(-8);


        // Process each item review
        for (const reviewItem of reviewItems) {
            const { itemId, decision, faultAssignedTo, faultDetails, notes } = reviewItem;

            const item = order.orderItems.find(i => i._id.toString() === itemId);

            if (!item) {
                continue;
            }

            if (!item.replacement || !item.replacement.isRequested) {
                continue;
            }


            // Update replacement status
            item.replacement.status = decision === "approve" ? "approved" : "rejected";
            item.replacement.reviewedAt = new Date();
            item.replacement.reviewedBy = adminId;
            item.replacement.notes = notes || "";



            // If approved
            if (decision === "approve") {
                item.replacement.fault = {
                    assignedTo: faultAssignedTo || "none",
                    details: faultDetails || ""
                };

                approvedCount++;

                const product = await Product.findById(item.prodId);

                if (!product) {
                    return res.status(404).json({ 
                        message: `Product "${item.prodName}" not found in system`,
                        itemId: itemId
                    });
                }

                // Check if product has enough stock
                if (product.stocks < item.quantity) {
                    return res.status(400).json({ 
                        message: `Insufficient stock for "${item.prodName}". Available: ${product.stocks}, Needed: ${item.quantity}. Please reject this replacement request.`,
                        itemId: itemId,
                        availableStock: product.stocks,
                        neededQuantity: item.quantity
                    });
                }

                // ========================================
                // HANDLE SELLER FAULT - APPROVED
                // ========================================
                if (faultAssignedTo === "seller") {
                    const sellerId = item.seller.id;
                    const today = new Date().toISOString().split("T")[0];

                    // Hanapin yung payout ng seller tapos bawasan ng 30
                    const payout = await PayoutTransaction.findOne({ 
                        sellerId, 
                        date: today, 
                        status: "pending" 
                    });

                    if (payout) {
                        payout.totalAmount -= 30;
                        await payout.save();
                    }
                }

                // ========================================
                // HANDLE RIDER FAULT - APPROVED
                // ========================================
                if (faultAssignedTo === "rider") {
                    const riderId = order.riderId;
                    
                    if (riderId) {
                        const damageValue = item.prodPrice * item.quantity;
                        const riderLiability = damageValue * 0.30;
                        
                        await DamageLog.create({
                            rider: riderId,
                            order: order.orderId,
                            itemDamaged: `${item.prodName}(${item.pid}) (Qty: ${item.quantity > 1 ? `${item.quantity} bundles` : `${item.quantity} bundle`})`,
                            damageValue: damageValue,
                            riderLiability: riderLiability,
                            status: 'pending',
                            notes: faultDetails || `Replacement approved due to rider fault`
                        });
                    }
                }

                // Notify BUYER about approved replacement
                await createNotification(
                    adminId,
                    "admin",
                    buyerId,
                    "user",
                    `Your replacement request for "${item.prodName}" has been approved. Your replacement will be prepared for delivery.`,
                    'orderdetails',
                    "replacement approved",
                    { 
                        orderId, 
                        orderIdShort, 
                        itemId: item._id,
                        itemName: item.prodName,
                        faultAssignedTo
                    }
                );
                io.emit('user notif');

            } else {
                // ========================================
                // REJECTED - OUT OF STOCK / REFUND SCENARIO
                // ========================================
                rejectedCount++;

                const refundAmount = item.prodPrice * item.quantity;

                // HANDLE SELLER FAULT - REJECTED (Refund)
                if (faultAssignedTo === "seller") {
                    const sellerId = item.seller.id;
                    const today = new Date().toISOString().split("T")[0];

                    // Bawasan yung payout ng seller ng refund amount
                    const payout = await PayoutTransaction.findOne({ 
                        sellerId, 
                        date: today, 
                        status: "pending" 
                    });

                    if (payout) {
                        payout.totalAmount -= refundAmount;
                        await payout.save();
                    }

                    // Add to refund history
                    order.refundHistory.push({
                        itemId: item._id,
                        itemName: item.prodName,
                        pid: item.pid,
                        amount: refundAmount,
                        reason: `Product issue by seller - Replacement unavailable (out of stock)`,
                        triggerEvent: "replacement_rejected",
                        faultParty: faultAssignedTo,
                        requestedAt: new Date(),
                        notes: faultDetails || notes || ''
                    });
                }

                // HANDLE RIDER FAULT - REJECTED
                if (faultAssignedTo === "rider") {
                    const riderId = order.riderId;
                    
                    if (riderId) {
                        const riderLiability = refundAmount * 0.30;
                        
                        await DamageLog.create({
                            rider: riderId,
                            order: order.orderId,
                            itemDamaged: `${item.prodName}(${item.pid}) (Qty: ${item.quantity > 1 ? `${item.quantity} bundles` : `${item.quantity} bundle`})`,
                            damageValue: refundAmount,
                            riderLiability: riderLiability,
                            status: 'pending',
                            notes: faultDetails || `Replacement rejected - out of stock`
                        });
                        
                        order.refundHistory.push({
                            itemId: item._id,
                            itemName: item.prodName,
                            pid: item.pid,
                            amount: refundAmount,
                            reason: `Product damaged by ${faultAssignedTo} - Replacement unavailable (out of stock)`,
                            triggerEvent: "replacement_rejected",
                            faultParty: faultAssignedTo,
                            riderLiability: riderLiability,
                            requestedAt: new Date(),
                            notes: faultDetails || notes || ''
                        });
                    }
                }

                // Notify BUYER about rejection and refund
                await createNotification(
                    adminId,
                    "admin",
                    buyerId,
                    "user",
                    `Your replacement request for "${item.prodName}" has been rejected.${notes ? ` Reason: ${notes}` : ''} A refund of ₱${refundAmount.toFixed(2)} is being processed.`,
                    `orderdetails`,
                    "replacement rejected",
                    { 
                        orderId, 
                        orderIdShort, 
                        itemId: item._id,
                        itemName: item.prodName,
                        reason: notes || "",
                        refundAmount
                    }
                );
                io.emit('user notif');
            }
        }



        // ========================================
        // GROUP BY SELLER AND SEND SMS
        // ========================================
        const sellerReplacementGroups = {};

        for (const reviewItem of reviewItems) {
            const { itemId, decision, faultAssignedTo } = reviewItem;
            const item = order.orderItems.find(i => i._id.toString() === itemId);
            
            if (!item || decision !== "approve") continue;
            
            const sellerId = item.seller.id;
            
            if (!sellerReplacementGroups[sellerId]) {
                sellerReplacementGroups[sellerId] = {
                    sellerName: item.seller.name,
                    items: [],
                    faultAssignedTo: faultAssignedTo
                };
            }
            
            sellerReplacementGroups[sellerId].items.push({
                prodName: item.prodName,
                quantity: item.quantity
            });
        }

        // SEND SMS TO SELLERS (ONE MESSAGE PER SELLER)
        for (const sellerId in sellerReplacementGroups) {
            const seller = await Seller.findById(sellerId);
            if (!seller) {
                console.log(`Seller ${sellerId} not found`);
                continue;
            }
            
            const sellerContact = seller.e_WalletAcc?.number;
            const { items, faultAssignedTo } = sellerReplacementGroups[sellerId];
            
            // Build product list string - EXACTLY like your format
            const productList = items.map(item => 
                `${item.prodName} (${item.quantity} bundle${item.quantity > 1 ? 's' : ''})`
            ).join(', ');
            

            console.log("---------------------");
            console.log("Seller:", seller.firstname);
            console.log("Contact:", sellerContact);
            console.log("Products:", productList);
            console.log("Fault:", faultAssignedTo);
            console.log("Order ID:", order.orderId);
            
            // Send SMS with all products in one message
            await sendReplacementSMS(
                sellerContact, 
                seller.firstname, 
                order.orderId, 
                productList,
                faultAssignedTo
            );
        }











        // Check if ALL requested items are now reviewed
        const allItemsReviewed = order.orderItems.every(item => {
            if (!item.replacement?.isRequested) return true;
            return item.replacement.status === "approved" || item.replacement.status === "rejected";
        });

        const hasApprovedItem = order.orderItems.some(item => 
            item.replacement?.isRequested && item.replacement.status === "approved"
        );
        

        // ========================================
        // UPDATE ORDER STATUS BASED ON REVIEW RESULTS
        // ========================================
        if (allItemsReviewed) {
            if (hasApprovedItem) {
                order.statusDelivery = "replacement confirmed";

                let statusDescription = "";
                if (rejectedCount > 0) {
                    statusDescription = `${approvedCount} replacement ${approvedCount === 1 ? 'request' : 'requests'} approved. ${rejectedCount} ${rejectedCount === 1 ? 'item was' : 'items were'} rejected for being unreasonable. Please wait for your replacement product${approvedCount > 1 ? 's' : ''}.`;
                } else {
                    statusDescription = `${approvedCount} replacement ${approvedCount === 1 ? 'request' : 'requests'} approved by admin.`;
                }

                order.statusHistory.push({
                    status: "replacement confirmed",
                    description: statusDescription,
                    location: "Admin Office",
                    date: new Date().toLocaleDateString("en-PH", {
                        month: "short",
                        day: "numeric"
                    }),
                    timestamp: new Date().toLocaleTimeString("en-PH", {
                        timeZone: "Asia/Manila",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true
                    }),
                    performedBy: {
                        id: adminId,
                        role: "Admin",
                        name: adminName
                    }
                });

            } else {
                order.statusDelivery = "replacement rejected";

                const rejectedItem = order.orderItems.find(item => 
                    item.replacement?.isRequested && item.replacement.status === "rejected"
                );
                const rejectionReason = rejectedItem?.replacement?.notes || "Request deemed unreasonable";

                order.statusHistory.push({
                    status: "replacement rejected",
                    description: `We have rejected your replacement ${rejectedCount === 1 ? 'request' : 'requests'} (${rejectedCount} ${rejectedCount === 1 ? 'item' : 'items'}). Admin Note: ${rejectionReason}`,
                    location: "Admin Office",
                    date: new Date().toLocaleDateString("en-PH", {
                        month: "short",
                        day: "numeric"
                    }),
                    timestamp: new Date().toLocaleTimeString("en-PH", {
                        timeZone: "Asia/Manila",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true
                    }),
                    performedBy: {
                        id: adminId,
                        role: "Admin",
                        name: adminName
                    }
                });
            }
        }

        await order.save();

        // Log activity
        let activityMessage = "";
        if (approvedCount > 0 && rejectedCount > 0) {
            activityMessage = `Reviewed replacement requests in order #${orderIdShort}: ${approvedCount} approved, ${rejectedCount} rejected`;
        } else if (approvedCount > 0) {
            activityMessage = `Approved ${approvedCount} replacement ${approvedCount === 1 ? 'request' : 'requests'} in order #${orderIdShort}`;
        } else {
            activityMessage = `Rejected ${rejectedCount} replacement ${rejectedCount === 1 ? 'request' : 'requests'} in order #${orderIdShort}`;
        }

        await createActivityLog(
            adminId,
            'REVIEW REPLACEMENT REQUEST',
            activityMessage,
            req
        );

        return res.status(200).json({ 
            message: `Successfully reviewed ${approvedCount + rejectedCount} replacement ${approvedCount + rejectedCount === 1 ? 'request' : 'requests'}`,
            approvedCount,
            rejectedCount
        });

    } catch (error) {
        console.error("Review replacement error:", error);
        return res.status(500).json({ message: error.message });
    }
};