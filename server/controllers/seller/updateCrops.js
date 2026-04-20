import multer from "multer";
import Product from "../../models/products.js";
import cloudinary from "../../config/cloudinary.js";

const storage = multer.memoryStorage();
export const update = multer({ storage: storage });

export const updateCrops = async(req, res) => {
    try {
        const { id, name, price, stocks, category, productType, disc, image, kg, lifeSpan } = req.body;
        const { id: sellerId } = req.account;

        // Single query — kuha lahat ng kailangan
        const oldProduct = await Product.findById(id).select('cloudinaryId totalStocks lifeSpan seller');

        if (!oldProduct) {
            return res.status(404).json({ message: "Product not found" });
        }

        // Duplicate name check
        const existingProduct = await Product.findOne({ 
            name, 
            'seller.id': sellerId,
            _id: { $ne: id }
        });

        if (existingProduct) {
            return res.status(400).json({ message: "You already have another product with this name!" });
        }

        let imageFile = image;
        let newCloudinaryId = null;
        const oldCloudinaryId = oldProduct.cloudinaryId;

        if (req.file) {
            const base64 = req.file.buffer.toString('base64');
            const dataURI = `data:${req.file.mimetype};base64,${base64}`;
            const result = await cloudinary.uploader.upload(dataURI, { folder: 'products' });
            imageFile = result.secure_url;
            newCloudinaryId = result.public_id;
        }

        const updateData = { 
            name, price, stocks, kg, lifeSpan, 
            category, productType, disc, imageFile
        };

        // Fix — mag-update lang ng expiry kung talagang nagbago ang lifeSpan
        if (Number(lifeSpan) !== oldProduct.lifeSpan) {
            updateData.expiryDate = new Date(
                Date.now() + Number(lifeSpan) * 24 * 60 * 60 * 1000
            );
            updateData.notified = false;
            updateData.status = "active";
        }

        // Update totalStocks kung mas mataas ang bagong stocks
        if (Number(stocks) > oldProduct.totalStocks) {
            updateData.totalStocks = Number(stocks);
        }

        if (newCloudinaryId) {
            updateData.cloudinaryId = newCloudinaryId;
        }

        await Product.findByIdAndUpdate(id, updateData, { new: true });

        // Delete old image (non-blocking)
        if (oldCloudinaryId && newCloudinaryId) {
            cloudinary.uploader.destroy(oldCloudinaryId).catch(err => 
                console.error('Failed to delete old image:', err)
            );
        }

        io.emit('product:updated');
        res.status(200).json({ message: "Product successfully updated!" });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};