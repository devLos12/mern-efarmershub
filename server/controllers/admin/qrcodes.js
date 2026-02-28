import QrCode from "../../models/qrCodes.js";
import multer from "multer";
import cloudinary from "../../config/cloudinary.js";
import { isObjectIdOrHexString } from "mongoose";




// ✅ CHANGE: Use memoryStorage instead of diskStorage
const storage = multer.memoryStorage();

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
            // Get existing QR code to delete old Cloudinary image
            const existingGcash = await QrCode.findOne({ paymentMethod: 'gcash' });
            const oldCloudinaryId = existingGcash?.cloudinaryId;

            // ✅ CHANGE: Convert buffer to base64 for Cloudinary
            try {
                const base64Gcash = gcash.buffer.toString('base64');
                const dataURIGcash = `data:${gcash.mimetype};base64,${base64Gcash}`;

                const gcashResult = await cloudinary.uploader.upload(dataURIGcash, {
                    folder: 'qr-codes/gcash',
                    secure: true
                });

                // Update or create in database
                await QrCode.findOneAndUpdate(
                    { paymentMethod: 'gcash' },
                    { 
                        imageUrl: gcashResult.secure_url,
                        cloudinaryId: gcashResult.public_id
                    },
                    { upsert: true, new: true }
                );

                // Delete old Cloudinary image (non-blocking)
                if (oldCloudinaryId) {
                    cloudinary.uploader.destroy(oldCloudinaryId).catch(err => 
                        console.error('Failed to delete old GCash QR from Cloudinary:', err)
                    );
                }
            } catch (uploadError) {
                return res.status(400).json({ message: "Failed to upload GCash QR to Cloudinary!" });
            }
        }

        // Update or create Maya QR
        if (maya) {
            // Get existing QR code to delete old Cloudinary image
            const existingMaya = await QrCode.findOne({ paymentMethod: 'maya' });
            const oldCloudinaryId = existingMaya?.cloudinaryId;

            // ✅ CHANGE: Convert buffer to base64 for Cloudinary
            try {
                const base64Maya = maya.buffer.toString('base64');
                const dataURIMaya = `data:${maya.mimetype};base64,${base64Maya}`;

                const mayaResult = await cloudinary.uploader.upload(dataURIMaya, {
                    folder: 'qr-codes/maya',
                    secure: true
                });

                // Update or create in database
                await QrCode.findOneAndUpdate(
                    { paymentMethod: 'maya' },
                    { 
                        imageUrl: mayaResult.secure_url,
                        cloudinaryId: mayaResult.public_id
                    },
                    { upsert: true, new: true }
                );

                // Delete old Cloudinary image (non-blocking)
                if (oldCloudinaryId) {
                    cloudinary.uploader.destroy(oldCloudinaryId).catch(err => 
                        console.error('Failed to delete old Maya QR from Cloudinary:', err)
                    );
                }
            } catch (uploadError) {
                return res.status(400).json({ message: "Failed to upload Maya QR to Cloudinary!" });
            }
        }


        io.emit('qrcode:update', { message: "new qr update"});

        return res.status(200).json({ 
            message: "QR code updated successfully", 
            success: true 
        });

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

        // Find the QR code first to get cloudinaryId
        const qrCode = await QrCode.findOne({ paymentMethod: type });

        if (!qrCode) {
            return res.status(404).json({ 
                success: false,
                message: `${type} QR code not found` 
            });
        }

        const cloudinaryId = qrCode.cloudinaryId;

        // Update database - set imageUrl and cloudinaryId to null
        await QrCode.findOneAndUpdate(
            { paymentMethod: type },
            { 
                imageUrl: null,
                cloudinaryId: null
            },
            { new: true }
        );
        
        // Delete from Cloudinary (non-blocking)
        if (cloudinaryId) {
            cloudinary.uploader.destroy(cloudinaryId).catch(err => 
                console.error(`Failed to delete ${type} QR from Cloudinary:`, err)
            );
        }

        io.emit('qrcode:delete', { message: `${type} qr code has been deleted`});

        return res.status(200).json({ 
            success: true,
            message: `${type} QR code deleted successfully` 
        });

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};