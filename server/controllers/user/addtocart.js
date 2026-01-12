
import Cart from "../../models/cart.js";
import Product from "../../models/products.js";
import mongoose from "mongoose";


const addItemsToCart = async(req, res) =>{

    try{
        
        const id = req.account.id;
        const { items } =  req.body;


        for(let i = 0; i < items.length; i++){
            const item = items[i];
            
            let cart = await Cart.findOne({ userId : id}); 

            await Product.updateOne(
                { _id: item.prodId},
                { $inc: { stocks : - 1 } }
            );


            if(!cart){
                cart = new Cart({
                    userId : id, 
                    items : [{
                        seller: item.seller,
                        prodId: item.prodId , 
                        prodName: item.prodName, 
                        prodDisc: item.prodDisc, 
                        prodPrice: item.prodPrice, 
                        imageFile: item.imageFile
                }] });
            }else{
                const existingItem = cart.items.find((i) => i.prodId.toString() === item.prodId);
                
                if(existingItem){
                    existingItem.quantity += 1;
                }else{
                    cart.items.push({ 
                        seller: item.seller,
                        prodId: item.prodId, 
                        prodName: item.prodName, 
                        prodDisc: item.prodDisc, 
                        prodPrice: item.prodPrice, 
                        imageFile: item.imageFile
                    });
                }
            }
            await cart.save();
        }        
        

        res.status(200).json({message : "item added to cart"});
    }catch(error){
        res.status(500).json({message : error.message});
    }
}

export default addItemsToCart;


