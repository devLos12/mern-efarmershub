import { json } from "express";
import Seller from "../../models/seller.js";


const getInfo = async(req, res) => {

    try{ 

        const sellerId = req.account.id;
        
        
        const seller = await Seller.findOne({_id : sellerId});

        if(!seller){
            return res.status(401).json({ message : "Account not found!"});
        } 

        res.status(200).json(seller);
    }catch(error){
        res.status(500).json({ message : error.message});
    }

}

export default getInfo;