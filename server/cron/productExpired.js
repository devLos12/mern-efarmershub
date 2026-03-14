import cron from "node-cron";
import Product from "../models/products.js";




const startSchedule = () => {


     // ✅ Expiry checker — every hour
    cron.schedule("0 * * * *", async () => {
        try {
            const now = new Date();

            // Step 2 — mark as expired
            const result = await Product.updateMany(
                { 
                    statusApprove: "approved",
                    status: "active",
                    expiryDate: { $lte: now }
                },
                { $set: { status: "expired" } }
            );

            if (result.modifiedCount > 0) {
                console.log(`${result.modifiedCount} product(s) marked as expired.`);
            } else {
                console.log("No products to expire.");
            }

        } catch (error) {
            console.log("Expiry cron error:", error.message);
        }
    });

};

startSchedule();