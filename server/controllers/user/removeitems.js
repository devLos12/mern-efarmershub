import Cart from "../../models/cart.js";
import Product from "../../models/products.js";


const removeItemFromCart = async(req, res)=>{
    try{

        const userId = req.account.id;
        const prodId = req.params.prodId;

        const cart = await Cart.findOne({ userId });
        
        const itemToRemove = cart.items.find(
            item => item.prodId.toString() === prodId 
        )

        const quantityToReturn = itemToRemove.quantity;

        await Cart.updateOne(
            {userId}, 
            {$pull : { items : { prodId }}}
        );

        const updatedCart = await Cart.findOne({ userId });
        
        if(updatedCart.items.length === 0){
            await updatedCart.deleteOne(); 
        }

        await Product.updateOne(
            { _id: prodId},
            { $inc: { stocks : + quantityToReturn} }
        );


        res.status(200).json({message : "item removed Successfully!"});
    }catch(error){
        res.status(500).json({message : error.message});
    }
}


export default removeItemFromCart;