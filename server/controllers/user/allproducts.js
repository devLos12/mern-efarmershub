import Product from "../../models/products.js";


export const AllProducts = async (req, res) => {
    try { 
        const products = await Product.find({ 
            statusApprove: "approved",
            status: { $ne: "expired" }
        });

        if (products.length === 0) {
            return res.status(404).json({ message: "No products available" }); 
        }
        
        res.status(200).json(products);
        
    } catch (error) {
        res.status(500).json(error.message);
    }
}