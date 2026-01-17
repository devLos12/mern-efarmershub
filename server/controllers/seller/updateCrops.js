import multer from "multer";
import Product from "../../models/products.js";
import cloudinary from "../../config/cloudinary.js";

import fs from "fs"; // Para delete local file

const storage = multer.diskStorage({
    destination: "./uploads",
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${file.originalname}`;
        cb(null, uniqueName)
    }
})

export const update = multer({ storage: storage });

export const updateCrops = async(req, res) => {
    try {
        const { id, name, price, stocks, category, productType, disc, image, kg, lifeSpan } = req.body;
        
        let imageFile = image; // Default: keep old image
        let newCloudinaryId = null;

        
        
        // If new image uploaded
        if (req.file) {
            // Get current product to delete old image
            const currentProduct = await Product.findById(id);
            
            // Delete old image from Cloudinary
            if (currentProduct.cloudinaryId) {
                await cloudinary.uploader.destroy(currentProduct.cloudinaryId);
            }

            // Upload new image to Cloudinary
            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: 'products',
                secure: true
            });

            imageFile = result.secure_url; // New Cloudinary URL
            newCloudinaryId = result.public_id;

            // Delete local file
            fs.unlinkSync(req.file.path);
        }

        // Check if another product with same name exists (excluding current product)
        const { id: sellerId } = req.account; // From authMiddleware
        const existingProduct = await Product.findOne({ 
            name, 
            'seller.id': sellerId,
            _id: { $ne: id } // exclude current product
        });

        if (existingProduct) {
            return res.status(400).json(
                { message: "You already have another product with this name!" }
            )
        }

        const updateData = { 
            name, 
            price, 
            stocks, 
            kg, 
            lifeSpan, 
            category, 
            productType,
            disc, 
            imageFile
        };

        // Only update cloudinaryId if new image was uploaded
        if (newCloudinaryId) {
            updateData.cloudinaryId = newCloudinaryId;
        }

        const updateProduct = await Product.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        )

        if(stocks > updateProduct.totalStocks){
            await Product.findByIdAndUpdate(id, { totalStocks: stocks } );
        }
        
        if (!updateProduct) {
            return res.status(404).json({ message: "Product not found" })
        } 

        io.emit('product:updated');
        res.status(200).json({ message: `Product successfully updated!` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}