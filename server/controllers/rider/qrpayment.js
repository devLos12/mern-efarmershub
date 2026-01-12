
import QrCode from "../../models/qrCodes.js";


export const getQrCodes = async (req, res) => {
    try {
        const gcash = await QrCode.findOne({ paymentMethod: 'gcash' });
        const maya = await QrCode.findOne({ paymentMethod: 'maya' });

        return res.status(200).json({
            success: true,
            data: {
                gcashQr: gcash?.imageUrl || null,
                mayaQr: maya?.imageUrl || null
            }
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

