import multer from "multer";
import Product from "../../models/products.js";
import cloudinary from "../../config/cloudinary.js";

const storage = multer.memoryStorage();
export const update = multer({ storage: storage });

export const updateCrops = async(req, res) => {
    try {
        const { id, name, price, stocks, category, productType, disc, unit, kg, lifeSpan } = req.body;
        const { id: sellerId } = req.account;

        // Single query — kuha lahat ng kailangan
        const oldProduct = await Product.findById(id).select('imageFile totalStocks lifeSpan seller');

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

        const updateData = { 
            name, price, stocks, category, productType, disc,
            unit,
            imageFile: finalImages,
        };

        if (unit === "kg" && kg) {
            updateData.kg = parseFloat(kg);
        }


        if (lifeSpan) {
            updateData.status = "active";
            updateData.notified = false;
            updateData.lifeSpan = Number(lifeSpan);
            updateData.expiryDate = new Date(Date.now() + Number(lifeSpan) * 24 * 60 * 60 * 1000);
        }

        // Update totalStocks kung mas mataas ang bagong stocks
        if (Number(stocks) > oldProduct.totalStocks) {
            updateData.totalStocks = Number(stocks);
        }

        await Product.findByIdAndUpdate(id, updateData, { new: true });

        // Delete removed images from Cloudinary (non-blocking)
        const removedImages = oldProduct.imageFile.filter(
            (old) => !existingImages.some((ex) => ex.cloudinaryId === old.cloudinaryId)
        );

        removedImages.forEach((img) => {
            cloudinary.uploader.destroy(img.cloudinaryId).catch((err) =>
                console.error("Failed to delete old image:", err)
            );
        });

        io.emit('product:updated');
        res.status(200).json({ message: "Product successfully updated!" });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};