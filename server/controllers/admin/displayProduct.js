import Product from "../../models/products.js";
import mongoose from "mongoose";
import cloudinary from "../../config/cloudinary.js";



export const getProducts = async(req, res) =>{
    try{
        
        const products = await Product.find();
        
        if(!products || products.length === 0){ 
            return res.status(404).json({message : "No crops display"});
        }

        res.status(200).json(products);
    }catch(error){
        res.status(500).json(error.message)
    }
}



export const removeProducts = async(req, res)=>{
    try{
        const id = req.params.id;


        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid product ID" });
        }

        // Find the product first to get the cloudinaryId
        const product = await Product.findById(id);

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        // Delete image from Cloudinary if cloudinaryId exists
        if (product.cloudinaryId) {
            await cloudinary.uploader.destroy(product.cloudinaryId);
        }

        // Delete the product from database
        await Product.deleteOne({ _id: id });

        io.emit("product:deleted", { message: "product deleted."});
        res.status(201).json({message : `Successfully Deleted!`});
    }catch(error){
        res.status(500).json({ message : error.message});
    }
}