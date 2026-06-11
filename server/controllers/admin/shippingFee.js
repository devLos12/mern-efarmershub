import ShippingFee from "../../models/shippingFee.js";
import { createActivityLog } from "./activity-log.js";

export const getShippingFee = async(req, res) => {
    try {   
        let fee = await ShippingFee.findOne();
        
        if (!fee) {
            fee = await ShippingFee.create({ 
                amount: 60,
                surcharges: [
                    { purok: "1", additionalFee: 0 },
                    { purok: "2", additionalFee: 0 },
                    { purok: "3", additionalFee: 0 },
                    { purok: "4", additionalFee: 0 },
                    { purok: "5", additionalFee: 0 },
                    { purok: "6", additionalFee: 0 },
                ]
            });
        }
        
        return res.status(200).json(fee);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

export const updateShippingFee = async(req, res) => {
    try {
        const { amount, surcharges } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ message: "Invalid amount" });
        }

        if (surcharges) {
            for (const s of surcharges) {
                if (s.additionalFee < 0) {
                    return res.status(400).json({ message: `Invalid surcharge for Purok ${s.purok}` });
                }
            }
        }

        const updatePayload = { amount };
        if (surcharges) updatePayload.surcharges = surcharges;

        const fee = await ShippingFee.findOneAndUpdate(
            {},
            updatePayload,
            { upsert: true, new: true }
        );

        await createActivityLog(
            req.account.id,
            'UPDATE SHIPPING FEE',
            `Updated shipping fee to ₱${amount}${surcharges ? " with surcharges" : ""}`,
            req
        );
        
        return res.status(200).json(fee);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}