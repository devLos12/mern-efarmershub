import Cart from "../../models/cart.js";
import Product from "../../models/products.js";
import mongoose from "mongoose";

const addItemsToCart = async(req, res) => {
    try {
        const id = req.account.id;
        const { items } = req.body;

        // ✅ Validate items first
        if (!items || items.length === 0) {
            return res.status(400).json({ message: "No items provided" });
        }

        for(let i = 0; i < items.length; i++) {
            const item = items[i];
            
            // ✅ Step 1: Validate product exists and has stock
            const product = await Product.findById(item.prodId);
            
            if (!product) {
                return res.status(404).json({ 
                    message: `Product not found: ${item.prodName}` 
                });
            }

            if (product.stocks < 1) {
                return res.status(400).json({ 
                    message: `Out of stock: ${item.prodName}` 
                });
            }

            // ✅ Step 2: Find or create cart
            let cart = await Cart.findOne({ userId: id }); 

            if (!cart) {
                                
                cart = new Cart({
                    userId: id, 
                    items: [{
                        seller: item.seller,
                        prodId: item.prodId,
                        pid: item.pid, 
                        prodName: item.prodName, 
                        prodDisc: item.prodDisc, 
                        prodPrice: item.prodPrice, 
                        imageFile: item.imageFile,
                        quantity: 1  // ✅ IMPORTANT!
                    }]
                });

            } else {
                // ✅ UPDATE EXISTING CART
                console.log("Updating existing cart for user:", id);
                
                const existingItem = cart.items.find(
                    (i) => i.prodId.toString() === item.prodId
                );
                
                if (existingItem) {
                    // ✅ Item exists - increment quantity
                    existingItem.quantity += 1;
                    console.log(`Incremented quantity for ${item.prodName}`);
                    
                } else {
                    // ✅ New item - push to array
                    cart.items.push({ 
                        seller: item.seller,
                        prodId: item.prodId, 
                        pid: item.pid, 
                        prodName: item.prodName, 
                        prodDisc: item.prodDisc, 
                        prodPrice: item.prodPrice, 
                        imageFile: item.imageFile,
                        quantity: 1  // ✅ IMPORTANT!
                    });
                    console.log(`Added new item: ${item.prodName}`);
                }
            }

            // ✅ Step 3: Save cart FIRST
            await cart.save();

            // ✅ Step 4: Deduct stock AFTER successful cart save
            await Product.updateOne(
                { _id: item.prodId, stocks: { $gte: 1 } },  // Safety check
                { $inc: { stocks: -1 } }
            );
        }

        return res.status(200).json({ message: "Item added to cart" });
        
    } catch(error) {
        console.error("❌ Error in addItemsToCart:", error);
        return res.status(500).json({ message: error.message });
    }
}

export default addItemsToCart;