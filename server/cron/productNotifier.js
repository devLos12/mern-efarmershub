import cron from "node-cron";
import Product from "../models/products.js";
import Notification from "../models/notification.js";
import User from "../models/user.js";
import Admin from "../models/admin.js";





const startSchedule = () => {

    cron.schedule("0 0 * * * *", async () => {

        const now = new Date();

        const products = await Product.find({ statusApprove: "approved", notified: false });

        if(products.length === 0){
            console.log("no products under system notice.");
            return;
        }

        for (const product of products) {

            // ✅ Based sa expiryDate, hindi createdAt
            const halfLifeDate = new Date(
                new Date(product.expiryDate).getTime() - 
                (product.lifeSpan / 2) * 24 * 60 * 60 * 1000
            );
            
            if ( 
                now >= halfLifeDate 
            ) {

                const [users, admins] = await Promise.all([
                    User.find({}, '_id'),
                    Admin.find({}, '_id')
                ]);

                const productSeller = product.seller?.id;

                const allRecipients = [
                    ...users.map(u => ({ id: u._id, role: "user" })),
                    ...(productSeller ? [{ id: productSeller, role: "seller" }] : []),
                    ...admins.map(a => ({ id: a._id, role: "admin" }))
                ];

                const notificationPromises = allRecipients.map(recipient => 
                    Notification.create({
                        sender: { role: "system" },
                        recipient: { 
                            id: recipient.id,
                            role: recipient.role
                        },
                        message: `Hurry! Fresh ${product.name} is halfway through its best freshness — grab yours before it's gone!`,
                        type: "system notice",
                        link: "productDetails",
                        meta: { 
                            prodId: product._id,
                            imageFile: product.imageFile?.[0]?.url || null,
                            sellerId: product.seller?.id  
                        }
                    })
                );

                await Promise.all(notificationPromises);

                product.notified = true;
                await product.save();
                io.emit("user:notifier", { message: "new user notification." });
                io.emit("seller:notifier", { message: "new seller notification." });
                io.emit("admin:notifier", { message: "new admin notification." });
                console.log(`Notified all users for: ${product.name}`);
            }
        }
    });
}

startSchedule();