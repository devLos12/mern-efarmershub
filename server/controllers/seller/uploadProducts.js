import multer from "multer";
import Product from "../../models/products.js";
import Seller from "../../models/seller.js";

const storage = multer.diskStorage({
    destination: "./uploads",
    filename: (req, file, cb) => {
        cb(null, file.originalname)
    }
})

export const upload = multer({ storage: storage });

export const uploadProducts = async(req, res) => {
    try {
        const { id, role } = req.account;

        const seller = await Seller.findOne({ _id: id });

        const { name, price, category, productType, stocks, kg, lifeSpan, disc } = req.body;
        const imageFile = req.file.filename;

        const existingProduct = await Product.findOne({ imageFile });

        if (existingProduct) {
            return res.status(400).json(
                { message: "Duplicate image detected! Use another image or file." });
        }

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
            const lastNumber = parseInt(lastProduct.prodId.replace("PID", "")); // PID0001 -> 1
            const nextNumber = lastNumber + 1;
            newProdId = "PID" + nextNumber.toString().padStart(4, "0"); // PID0002
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
            imageFile,
            seller: {
                imageFile: seller.imageFile,
                id: seller._id, 
                name: `${seller.firstname} ${seller.lastname}`, 
                email: seller.email
            }
        });
        
        await newProduct.save();

        // Emit socket event to admin - message only
     
        io.emit('product:uploaded', { message: `New product "${name}" uploaded by ${seller.firstname} ${seller.lastname}` });
        res.status(201).json({ message: "Uploaded Successfully" });
    } catch(error) {
        console.log(error.message);
        res.status(500).json({ message: "Server error occurred" });
    }
}