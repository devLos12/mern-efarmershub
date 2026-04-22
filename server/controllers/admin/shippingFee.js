import ShippingFee from "../../models/shippingFee.js";
import { createActivityLog } from "./activity-log.js";



export const getShippingFee = async(req, res) => {
    try {   
        let fee = await ShippingFee.findOne();
        
        if (!fee) {
            fee = await ShippingFee.create({ amount: 30 });
        }
        
                
        return res.status(200).json(fee);  // ← ibalik yung buong fee object
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}



export const updateShippingFee = async(req, res) => {
    try {
        const { amount } = req.body;


        if (!amount || amount <= 0) {
            return res.status(400).json({ message: "Invalid amount" });
        }

        const fee = await ShippingFee.findOneAndUpdate(
            {},                          // ← walang filter, iisa lang naman
            { amount },                  // ← i-update yung amount
            { upsert: true, new: true }  // ← upsert = create if not exists, new = ibalik yung updated
        );

        await createActivityLog(
            req.account.id,
            'UPDATE SHIPPING FEE',
            `Updated shipping fee to ₱${amount}`,
            req
        );
        
        return res.status(200).json(fee);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}
