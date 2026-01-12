import Rider from "../../models/rider.js";


const getRiders = async(req, res) =>{
    try{ 
        const riders = await Rider.find({ status: "available" });


        if(!riders || riders.length === 0) {
            return res.status(404).json({ message: "all rider not available "});
        }

        res.status(200).json(riders);
    }catch(err){
        res.status(500).json({ message: err.message});
    }
}
export default getRiders;