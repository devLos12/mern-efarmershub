import multer from "multer";
import Product from "../../models/products.js";
import cloudinary from "../../config/cloudinary.js";
import fs from "fs";



const storage = multer.diskStorage({
    destination: "./uploads",
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${file.originalname}`;
        cb(null, uniqueName)
    }
});


export const update = multer({ storage: storage });

export const updateCrops = async(req, res) => {
    try {
        const { id, name, price, stocks, category, productType, disc, image, kg, lifeSpan } = req.body;
        const { id: sellerId } = req.account;
        
        // Check duplicate name FIRST (before expensive operations)
        const existingProduct = await Product.findOne({ 
            name, 
            'seller.id': sellerId,
            _id: { $ne: id }
        });

        if (existingProduct) {
            // Delete uploaded file if validation fails
            if (req.file) {
                fs.unlinkSync(req.file.path);
            }
            return res.status(400).json(
                { message: "You already have another product with this name!" }
            )
        }

        let imageFile = image;
        let newCloudinaryId = null;
        let oldCloudinaryId = null;


        // If new image uploaded
        if (req.file) {
            // Get current product - SELECT only needed fields
            const currentProduct = await Product.findById(id).select('cloudinaryId');
            oldCloudinaryId = currentProduct?.cloudinaryId;

            // Upload new image to Cloudinary
            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: 'products',
                secure: true
            });

            imageFile = result.secure_url;
            newCloudinaryId = result.public_id;

            // Delete local file immediately
            fs.unlinkSync(req.file.path);
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

        if (newCloudinaryId) {
            updateData.cloudinaryId = newCloudinaryId;
        }

        // Update totalStocks in same query if needed
        if (stocks > 0) {
            const currentProduct = await Product.findById(id).select('totalStocks');
            if (stocks > currentProduct.totalStocks) {
                updateData.totalStocks = stocks;
            }
        }

        const updateProduct = await Product.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        )
        
        if (!updateProduct) {
            return res.status(404).json({ message: "Product not found" })
        }

        // Delete old Cloudinary image AFTER successful update (non-blocking)
        if (oldCloudinaryId) {
            cloudinary.uploader.destroy(oldCloudinaryId).catch(err => 
                console.error('Failed to delete old image:', err)
            );
        }

        io.emit('product:updated');
        res.status(200).json({ message: `Product successfully updated!` });
    } catch (error) {
        // Cleanup uploaded file on error
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ message: error.message });
    }
}