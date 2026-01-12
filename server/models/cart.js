import mongoose from "mongoose";

const cartSchema = new mongoose.Schema({
    userId : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "User", 
        required : true
    }, 
    items : [
        {   
            seller: {   
                id: { 
                    type: mongoose.Schema.Types.ObjectId, 
                    ref : "Seller",
                    required : true     
                },  
                name: { type: String, required: true}
            },
            prodId : {type : mongoose.Schema.Types.ObjectId, ref : "Product", required : true},
            prodName : {type : String, required : true},
            prodDisc : {type : String, required : true},
            prodPrice : { type : Number,  required : true}, 
            quantity : { type: Number, required : true, default : 1},
            imageFile : { type : String},
        }
    ],
})
const Cart = mongoose.model("Cart", cartSchema); 

export default Cart;

