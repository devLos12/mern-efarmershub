import multer from "multer";
import Product from "../../models/products.js";
import ActivityLog from "../../models/activityLogs.js";
import Admin from "../../models/admin.js";
import cloudinary from "../../config/cloudinary.js";

// Memory storage - direct to Cloudinary
const storage = multer.memoryStorage();
export const update = multer({ storage: storage });

export const updateCrops = async (req, res) => {
    try {
        const { id, name, category, disc, kg, lifeSpan, productType, unit } = req.body;

        // Convert to numbers para mag-match yung comparison
        const price = Number(req.body.price);
        const stocks = Number(req.body.stocks);

        // Get old product data
        const oldProduct = await Product.findById(id);

        if (!oldProduct) {
            return res.status(404).json({ message: "Product not found" });
        }

        let imageUpdated = false;

        // Parse existing images from frontend
        const existingImages = req.body.existingImages
            ? JSON.parse(req.body.existingImages)
            : [];

        // Upload new files to Cloudinary
        const newUploads = await Promise.all(
            (req.files || []).map(async (file) => {
                const base64 = file.buffer.toString("base64");
                const dataURI = `data:${file.mimetype};base64,${base64}`;
                const result = await cloudinary.uploader.upload(dataURI, { folder: "products" });
                return { url: result.secure_url, cloudinaryId: result.public_id };
            })
        );

        // Merge existing + new
        const finalImages = [...existingImages, ...newUploads];
        if (newUploads.length > 0) imageUpdated = true;

        const shouldReset = lifeSpan === "reset";
        const effectiveLifeSpan = shouldReset ? oldProduct.lifeSpan : Number(lifeSpan);

        const updateData = {
            name,
            price,
            stocks,
            totalStocks: stocks,
            unit,
            category,
            disc,
            productType,
            imageFile: finalImages,
        };
        
        if (unit === "kg" && kg) {
            updateData.kg = parseFloat(kg);
        }


        if (lifeSpan) {
            updateData.status = 'active';
            updateData.notified = false;
            updateData.lifeSpan = Number(lifeSpan);
            updateData.expiryDate = new Date(Date.now() + Number(lifeSpan) * 24 * 60 * 60 * 1000);
        }

        // Update product
        await Product.findByIdAndUpdate(id, updateData);

        // Activity Logging for Admin
        if (req.account?.role === "admin") {
            const ipAddress = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
                              req.ip || req.connection?.remoteAddress;
            const userAgent = req.get('user-agent');

            const admin = await Admin.findOne({ _id: req.account.id });

            if (oldProduct.name !== name) {
                await ActivityLog.create({
                    performedBy: admin._id,
                    adminType: admin.adminType,
                    action: 'UPDATE PRODUCT',
                    description: `Updated product name from "${oldProduct.name}" to "${name}"`,
                    ipAddress,
                    userAgent,
                    status: 'success'
                });
            }

            if (oldProduct.price !== price) {
                await ActivityLog.create({
                    performedBy: admin._id,
                    adminType: admin.adminType,
                    action: 'UPDATE PRODUCT',
                    description: `Updated product price from ₱${oldProduct.price} to ₱${price}`,
                    ipAddress,
                    userAgent,
                    status: 'success'
                });
            }

            if (oldProduct.stocks !== stocks) {
                await ActivityLog.create({
                    performedBy: admin._id,
                    adminType: admin.adminType,
                    action: 'UPDATE PRODUCT',
                    description: `Updated product stocks from ${oldProduct.stocks} to ${stocks}`,
                    ipAddress,
                    userAgent,
                    status: 'success'
                });
            }

            if (oldProduct.category !== category) {
                await ActivityLog.create({
                    performedBy: admin._id,
                    adminType: admin.adminType,
                    action: 'UPDATE PRODUCT',
                    description: `Updated product category from "${oldProduct.category}" to "${category}"`,
                    ipAddress,
                    userAgent,
                    status: 'success'
                });
            }

            if (imageUpdated) {
                await ActivityLog.create({
                    performedBy: admin._id,
                    adminType: admin.adminType,
                    action: 'UPDATE PRODUCT',
                    description: `Updated product image for "${name}"`,
                    ipAddress,
                    userAgent,
                    status: 'success'
                });
            }

            if (oldProduct.lifeSpan !== effectiveLifeSpan || shouldReset) {
                await ActivityLog.create({
                    performedBy: admin._id,
                    adminType: admin.adminType,
                    action: 'UPDATE PRODUCT',
                    description: shouldReset
                        ? `Reset expiry date of "${name}" using existing lifeSpan (${effectiveLifeSpan} days)`
                        : `Updated product lifeSpan from ${oldProduct.lifeSpan} to ${effectiveLifeSpan} days`,
                    ipAddress,
                    userAgent,
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
                    ipAddress,
                    userAgent,
                    status: 'success'
                });
            }
        }

        // Delete removed images from Cloudinary (non-blocking)
        const removedImages = oldProduct.imageFile.filter(
            (old) => !existingImages.some((ex) => ex.cloudinaryId === old.cloudinaryId)
        );

        removedImages.forEach((img) => {
            cloudinary.uploader.destroy(img.cloudinaryId).catch((err) =>
                console.error("Failed to delete old Cloudinary image:", err)
            );
        });

        io.emit('product:updated');
        res.status(200).json({ message: `Product successfully updated.` });

    } catch (error) {
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
                    ipAddress,
                    userAgent,
                    status: 'failed'
                });
            } catch (logError) {
                console.error('Failed to log error:', logError);
            }
        }

        res.status(500).json({ message: error.message });
    }
};