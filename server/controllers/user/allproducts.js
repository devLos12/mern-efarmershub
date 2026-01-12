import Product from "../../models/products.js";

export const AllProducts =  async (req, res) => {
    try{ 
    
        const AllProducts = await Product.find();
        
        if(AllProducts.length === 0 || !AllProducts){
            return res.status(404).json({message : "No products available"}); 
        }   

        const notPendingProducts = AllProducts.filter(product => product.statusApprove === "approved");

        if(notPendingProducts.length === 0){
            return res.status(404).json({message : "No products available"}); 
        }
        
        res.status(200).json(notPendingProducts);
        
    }catch(error){
        res.status(500).json(error.message);
    }
} 