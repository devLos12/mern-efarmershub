import multer from "multer";
import Product from "../../models/products.js";
import Seller from "../../models/seller.js";
import cloudinary from "../../config/cloudinary.js";


// Memory storage - direct to Cloudinary (no local file)
const storage = multer.memoryStorage();
export const upload = multer({ storage: storage });



export const uploadProducts = async(req, res) => {
    try {
        const { id, role } = req.account;

        const seller = await Seller.findOne({ _id: id });

        const { name, price, category, productType, stocks, unit, kg, lifeSpan, disc } = req.body;

        
        // Check duplicate name FIRST (before upload)
        const existingNameProduct = await Product.findOne({ 
            name, 
            'seller.id': id 
        });

        if (existingNameProduct) {
            return res.status(400).json(
                { message: "You already have a product with this name!" }
            );
        }
        
        // Direct upload to Cloudinary using base64
        // Validate files
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: "At least 1 image is required." });
        }

        // Upload all to Cloudinary
        const uploadedImages = await Promise.all(
            req.files.map(async (file) => {
                const base64 = file.buffer.toString("base64");
                const dataURI = `data:${file.mimetype};base64,${base64}`;
                const result = await cloudinary.uploader.upload(dataURI, { folder: "products" });
                return { url: result.secure_url, cloudinaryId: result.public_id };
            })
        );
        

        // Generate sequential product ID
        const lastProduct = await Product.findOne().sort({ createdAt: -1 });
        
        let newProdId = "PID0001";

        if (lastProduct && lastProduct.prodId) {
            const lastNumber = parseInt(lastProduct.prodId.replace("PID", "")); 
            const nextNumber = lastNumber + 1;
            newProdId = "PID" + nextNumber.toString().padStart(4, "0");
        }
        
        const newProduct = new Product({
            prodId: newProdId,
            name, 
            price, 
            category, 
            productType,
            stocks, 
            totalStocks: stocks,
            unit,
            kg, 
            lifeSpan, 
            disc, 
            imageFile: uploadedImages, 
            seller: {
                imageFile: seller.imageFile,
                id: seller._id, 
                name: `${seller.firstname} ${seller.lastname}`, 
                email: seller.email
            }
        });
        
        await newProduct.save();
     
        io.emit('product:uploaded', { message: `New product "${name}" uploaded by ${seller.firstname} ${seller.lastname}` });
        res.status(201).json({ message: "Uploaded Successfully" });
    } catch(error) {
        console.log(error.message);
        res.status(500).json({ message: "Server error occurred" });
    }
};