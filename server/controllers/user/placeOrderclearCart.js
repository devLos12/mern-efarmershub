import Cart from "../../models/cart.js";

const  placeOrderclearCart = async(req, res) => {
    try{
        const  userId  = req.account.id;

        await Cart.deleteMany({userId});
        res.status(200).json({message : "Cart has been cleared after order!"});
    }catch(error){
        res.status(500).json({message : error.message});
    }
}

export default placeOrderclearCart;