import cron from "node-cron";
import Product from "../models/products.js";
import Notification from "../models/notification.js";



const startSchedule = () => {

    cron.schedule("0 0 * * *", async () => {

        const now = new Date();

        const products = await Product.find({ statusApprove: "approved", notified: false });

        if(products.length === 0){
            console.log("no products under system notice.");
        }

        for ( const product of products){
            
            const created = new Date(product.createdAt);
            const elapsedDays = (now - created) / (1000 * 60 * 60 * 24);
            const halfLife = product.lifeSpan / 2;

            if (
                elapsedDays >= halfLife && !product.notified 
            ){
                await Notification.create({
                    sender: { role: "system"},
                    recipient: { role: "all" },
                    message: `Hurry! Fresh ${[product.name]} is halfway through its best freshness — grab yours before it’s gone!`,
                    type: "system notice",
                    link: "productDetails",
                    meta: { 
                        prodId: product._id,
                        imageFile: product.imageFile  
                    }
                })
                product.notified = true;
                await product.save();
                io.emit("user notif", { message: "new user notification."});
            }
        }
    });
}

startSchedule();