import Cart from "../../models/cart.js";
import Product from "../../models/products.js";
import mongoose from "mongoose";


const handleQuantity = async(req, res) =>{
    try{
        const userId = req.account.id;
        const { pendingData } = req.body;

        const cart = await Cart.findOne({ userId });
        
        if (!cart) {
            return res.status(404).json({ message: "Cart not found" });
        }

        
        let cartUpdated = false;

        for(let i = 0; i < pendingData.length; i++) {
            const data = pendingData[i];
            
            const item = cart.items.find((item) => item.prodId.toString() === data.prodId);
            const product = await Product.findById(data.prodId);

            if(!item || !product) continue
            

            if (data.operator === "+"){

                if(product.stocks === 0) continue

                item.quantity += 1

                await Product.updateOne(
                    { _id: new mongoose.Types.ObjectId(data.prodId)},
                    { $inc: { stocks : - 1 } }
                );
                
                cartUpdated = true;

            } else {
                if(item.quantity > 1){

                    item.quantity -= 1;
                    await Product.updateOne(
                        { _id: new mongoose.Types.ObjectId(data.prodId)},
                        { $inc: { stocks : + 1 } }
                    );

                    cartUpdated = true;

                }
            }
        }

        if(cartUpdated){
            await cart.save();
        }

        res.status(200).json({message : "Cart updated succesfully"});
    }catch(error){
        res.status(500).json({message : error.message});
    }
}


export default handleQuantity;