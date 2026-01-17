import mongoose from "mongoose";

const productSchema  = new mongoose.Schema({
    prodId: { type: String, required: true },
    seller: {   
        imageFile: { type: String, required: false},
        id: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref : "Seller",
            required : true     
        },
        email: { type: String, required: true},
        name: { type: String, required: true}
    },
    
    name : { type : String, required : true },
    price : { type : Number, required : true },
    productType: { type: String, required: true}, 
    category : { type : String, required : true, enum : [ 'fruits',
                                                'fruit vegetables', 
                                                'leafy vegetables', 
                                                'root crops', 
                                                'grains', 
                                                'legumes']},
    stocks : { type : Number, required : true },
    totalStocks : { type : Number, required : true },
    kg : { type : Number, required : true },
    disc  : { type : String, required : true },
    imageFile : { type : String, },
    
    lifeSpan: { type: Number, required: true },
    notified: { type: Boolean, required: false, default: false },

    statusApprove : {
        type : String, 
        enum : ["pending", "approved", "rejected"],
        default : "pending"
    },

    reviews: [{
        user : { 
            id : { type : mongoose.Schema.Types.ObjectId, ref : "User", required: true },
            name : { type : String, required : true},
            imageFile: { type: String, required: false},
        },
        rate : { type : Number, required : true},
        comment : { type : String, required : true},
        imageFile : { type : String},
        createdAt: { type: Date, default: Date.now }
    }],
    
    
    totalRatings : {type : Number, default: 0},
    numOfReviews: { type: Number,  default: 0 },
    averageRating: { type: Number, default: 0 },


    createdAt : { type: Date, default : Date.now},
})

const Product = mongoose.model('Product', productSchema);
export default Product; 