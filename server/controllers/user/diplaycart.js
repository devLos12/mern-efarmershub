import Cart from "../../models/cart.js";


const displayCart = async(req, res) =>{
    try{
        const userId = req.account.id;

        const cart = await Cart.findOne({userId});

        if(!cart){
            return res.status(404).json({ message : "No item"});
        }
        res.status(200).json(cart);
    }catch(error){
        res.status(500).json({message : error.message});
    }
}


export default displayCart;
