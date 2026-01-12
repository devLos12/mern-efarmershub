import QrCode from "../../models/qrCodes.js";
import multer from "multer";

const storage = multer.diskStorage({
    destination: "./uploads",
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${file.originalname}`;
        cb(null, uniqueName);
    }
});

export const upload = multer({ storage: storage });

export const qrCodeFiles = upload.fields([
    { name: 'gcashQr', maxCount: 1 },
    { name: 'mayaQr', maxCount: 1 }
]);


export const updateQr = async (req, res) => {
    try {
        const gcash = req.files?.gcashQr?.[0];
        const maya = req.files?.mayaQr?.[0];

        // Update or create GCash QR
        if (gcash) {
            await QrCode.findOneAndUpdate(
                { paymentMethod: 'gcash' },
                { imageUrl: gcash.filename },
                { upsert: true }
            );
        }

        // Update or create Maya QR
        if (maya) {
            await QrCode.findOneAndUpdate(
                { paymentMethod: 'maya' },
                { imageUrl: maya.filename },
                { upsert: true }
            );
        }

        return res.status(200).json({ message: "QR code updated successfully", success: true });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};


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




export const deleteQrCode = async (req, res) => {
    try {
        const { type } = req.params; // 'gcash' or 'maya'

        const qrCode = await QrCode.findOneAndUpdate(
            { paymentMethod: type },
            { imageUrl: null },
            { new: true }
        );

        if (!qrCode) {
            return res.status(404).json({ 
                success: false,
                message: `${type} QR code not found` 
            });
        }

        return res.status(200).json({ 
            success: true,
            message: `${type} QR code deleted successfully` 
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};