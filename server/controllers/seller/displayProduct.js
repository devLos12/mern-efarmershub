import Product from "../../models/products.js";
import mongoose from "mongoose";



export const getProducts = async(req, res) =>{
    try{
        
        const id = req.params.id;

        const products = await Product.find({"seller.id" : id });
        
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

        const result = await Product.deleteOne({ _id: id});

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: "Product not found" });
        }

        // io.emit("productDeleted");
        res.status(201).json({message : `Succesfully Deleted!`});
    }catch(error){
        res.status(500).json({ message : error.message});
    }
}