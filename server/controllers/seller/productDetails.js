import Product from "../../models/products.js";


const getProductDetails = async(req, res) => {

    try{
        const prodId = req.params.id;

        const product = await Product.findOne({_id : prodId});
        if(!product){
            return res.status(404).json({ message : "no data"});
        }

        res.status(200).json(product);
    }catch(err){
        res.status(500).json({ message : err.message});
    }
}

export default getProductDetails;