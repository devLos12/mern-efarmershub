import multer from "multer";
import Product from "../../models/products.js";
import ActivityLog from "../../models/activityLogs.js";
import Admin from "../../models/admin.js";
import cloudinary from "../../config/cloudinary.js";
import fs from "fs";




const storage = multer.diskStorage({
    destination: "./uploads",
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${file.originalname}`;
        cb(null, uniqueName)
    }
})


export const update = multer({ storage: storage });

export const updateCrops = async (req, res) => {
    try {
        const { id, name, category, disc, image, kg, lifeSpan } = req.body;
        
        // Convert to numbers para mag-match yung comparison
        const price = Number(req.body.price);
        const stocks = Number(req.body.stocks);

        // Get old product data
        const oldProduct = await Product.findById(id);
        
        if (!oldProduct) {
            // Cleanup uploaded file if product not found
            if (req.file && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            return res.status(404).json({ message: "Product not found" });
        }

        let imageFile = image;
        let newCloudinaryId = null;
        let oldCloudinaryId = oldProduct.cloudinaryId;
        let imageUpdated = false;

        // Handle Cloudinary upload if may bagong image
        if (req.file) {
            try {
                // Upload to Cloudinary
                const result = await cloudinary.uploader.upload(req.file.path, {
                    folder: 'products',
                    secure: true
                });

                imageFile = result.secure_url;
                newCloudinaryId = result.public_id;
                imageUpdated = true;

                // Delete local file immediately
                fs.unlinkSync(req.file.path);
            } catch (uploadError) {
                // Cleanup local file on upload error
                if (fs.existsSync(req.file.path)) {
                    fs.unlinkSync(req.file.path);
                }
                throw new Error(`Image upload failed: ${uploadError.message}`);
            }
        }

        // Prepare update data
        const updateData = { 
            name, 
            price, 
            stocks, 
            kg, 
            lifeSpan, 
            category, 
            disc, 
            imageFile 
        };

        if (newCloudinaryId) {
            updateData.cloudinaryId = newCloudinaryId;
        }

        // Update product
        await Product.findByIdAndUpdate(id, updateData);

        // Update totalStocks if needed
        if (stocks > oldProduct.totalStocks) {
            await Product.findByIdAndUpdate(id, { totalStocks: stocks });
        }

        // Activity Logging for Admin
        if (req.account?.role === "admin") {
            const ipAddress = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
                              req.ip || req.connection?.remoteAddress;
            const userAgent = req.get('user-agent');

            const admin = await Admin.findOne({ _id: req.account.id });

            // Log each specific change
            if (oldProduct.name !== name) {
                await ActivityLog.create({
                    performedBy: admin._id,
                    adminType: admin.adminType,
                    action: 'UPDATE PRODUCT',
                    description: `Updated product name from "${oldProduct.name}" to "${name}"`,
                    ipAddress: ipAddress,
                    userAgent: userAgent,
                    status: 'success'
                });
            }

            if (oldProduct.price !== price) {
                await ActivityLog.create({
                    performedBy: admin._id,
                    adminType: admin.adminType,
                    action: 'UPDATE PRODUCT',
                    description: `Updated product price from ₱${oldProduct.price} to ₱${price}`,
                    ipAddress: ipAddress,
                    userAgent: userAgent,
                    status: 'success'
                });
            }

            if (oldProduct.stocks !== stocks) {
                await ActivityLog.create({
                    performedBy: admin._id,
                    adminType: admin.adminType,
                    action: 'UPDATE PRODUCT',
                    description: `Updated product stocks from ${oldProduct.stocks} to ${stocks}`,
                    ipAddress: ipAddress,
                    userAgent: userAgent,
                    status: 'success'
                });
            }

            if (oldProduct.category !== category) {
                await ActivityLog.create({
                    performedBy: admin._id,
                    adminType: admin.adminType,
                    action: 'UPDATE PRODUCT',
                    description: `Updated product category from "${oldProduct.category}" to "${category}"`,
                    ipAddress: ipAddress,
                    userAgent: userAgent,
                    status: 'success'
                });
            }

            if (imageUpdated) {
                await ActivityLog.create({
                    performedBy: admin._id,
                    adminType: admin.adminType,
                    action: 'UPDATE PRODUCT',
                    description: `Updated product image for "${name}"`,
                    ipAddress: ipAddress,
                    userAgent: userAgent,
                    status: 'success'
                });
            }

            // If walang changes at all
            if (oldProduct.name === name && oldProduct.price === price && 
                oldProduct.stocks === stocks && oldProduct.category === category && !imageUpdated) {
                await ActivityLog.create({
                    performedBy: admin._id,
                    adminType: admin.adminType,
                    action: 'UPDATE PRODUCT',
                    description: `Updated product "${name}" (no changes detected)`,
                    ipAddress: ipAddress,
                    userAgent: userAgent,
                    status: 'success'
                });
            }
        }

        // Delete old Cloudinary image AFTER successful update
        if (oldCloudinaryId && newCloudinaryId) {
            cloudinary.uploader.destroy(oldCloudinaryId).catch(err => 
                console.error('Failed to delete old Cloudinary image:', err)
            );
        }

        io.emit('product:updated');
        res.status(200).json({ message: `Product successfully updated.` });

    } catch (error) {
        // Cleanup uploaded file on error
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        // Log error for admin
        if (req.account?.role === "admin") {
            try {
                const admin = await Admin.findOne({ _id: req.account.id });
                const ipAddress = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
                                  req.ip || req.connection?.remoteAddress;
                const userAgent = req.get('user-agent');

                await ActivityLog.create({
                    performedBy: admin._id,
                    adminType: admin.adminType,
                    action: 'UPDATE PRODUCT',
                    description: `Failed to update product: ${error.message}`,
                    ipAddress: ipAddress,
                    userAgent: userAgent,
                    status: 'failed'
                });
            } catch (logError) {
                console.error('Failed to log error:', logError);
            }
        }

        res.status(500).json({ message: error.message });
    }
}