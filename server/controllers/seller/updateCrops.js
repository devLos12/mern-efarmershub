import multer from "multer";
import Product from "../../models/products.js";
import cloudinary from "../../config/cloudinary.js";


// Use memory storage - direct to Cloudinary (no local file)
const storage = multer.memoryStorage();
export const update = multer({ storage: storage });

export const updateCrops = async(req, res) => {
    try {
        const { id, name, price, stocks, category, productType, disc, image, kg, lifeSpan } = req.body;
        const { id: sellerId } = req.account;
        
        // Check duplicate name FIRST
        const existingProduct = await Product.findOne({ 
            name, 
            'seller.id': sellerId,
            _id: { $ne: id }
        });

        if (existingProduct) {
            return res.status(400).json(
                { message: "You already have another product with this name!" }
            );
        }

        let imageFile = image;
        let newCloudinaryId = null;
        let oldCloudinaryId = null;

        // If new image uploaded - direct to Cloudinary using base64
        if (req.file) {
            // Get current product to get old cloudinaryId
            const currentProduct = await Product.findById(id).select('cloudinaryId');
            oldCloudinaryId = currentProduct?.cloudinaryId;

            // Convert buffer to base64 and upload to Cloudinary
            const base64 = req.file.buffer.toString('base64');
            const dataURI = `data:${req.file.mimetype};base64,${base64}`;
            
            const result = await cloudinary.uploader.upload(dataURI, {
                folder: 'products'
            });

            imageFile = result.secure_url;
            newCloudinaryId = result.public_id;
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

        // Update totalStocks if needed
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
        );
        
        if (!updateProduct) {
            return res.status(404).json({ message: "Product not found" });
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
        res.status(500).json({ message: error.message });
    }
};