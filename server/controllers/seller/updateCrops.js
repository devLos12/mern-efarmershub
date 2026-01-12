import multer from "multer";
import Product from "../../models/products.js";




const storage = multer.diskStorage({
    destination: "./uploads",
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()} - ${file.originalname}`;
        cb(null, uniqueName)
    }
})

export const update = multer({ storage: storage });


export const updateCrops = async(req, res) => {
    try {
        const { id, name, price, stocks, category, productType, disc, image, kg, lifeSpan } = req.body;
        const imageFile = req.file ? req.file.filename : null;

        // Check if another product with same name exists (excluding current product)
        const { sellerId } = req.account || req.body; // adjust based on your auth setup
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

        const updateProduct = await Product.findByIdAndUpdate(id,
            { 
                name, 
                price, 
                stocks, 
                kg, 
                lifeSpan, 
                category, 
                productType,
                disc, 
                imageFile: imageFile ?? image 
            },
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