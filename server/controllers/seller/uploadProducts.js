import multer from "multer";
import Product from "../../models/products.js";
import Seller from "../../models/seller.js";
import cloudinary from "../../config/cloudinary.js";
import fs from "fs"; // Para i-delete yung local file after upload




// Temporary storage lang - ideleted natin after upload to Cloudinary
const storage = multer.diskStorage({
    destination: "./uploads",
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname) // Unique filename
    }
})

export const upload = multer({ storage: storage });

export const uploadProducts = async(req, res) => {
    try {
        const { id, role } = req.account;

        const seller = await Seller.findOne({ _id: id });

        const { name, price, category, productType, stocks, kg, lifeSpan, disc } = req.body;

        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(req.file.path, {
            folder: 'products',
            secure: true
        });

        // Delete local file after upload
        fs.unlinkSync(req.file.path);

        const existingNameProduct = await Product.findOne({ 
            name, 
            'seller.id': id 
        });

        if (existingNameProduct) {
            return res.status(400).json(
                { message: "You already have a product with this name!" }
            )
        }
        
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
            kg, 
            lifeSpan, 
            disc, 
            imageFile: result.secure_url, // Cloudinary URL
            cloudinaryId: result.public_id, // Para sa pag-delete later
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
}