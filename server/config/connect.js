import mongoose from "mongoose";
import dotnev from "dotenv";

dotnev.config();    


const connectDb = async ()=> {
    try{
        const conn = await mongoose.connect(process.env.MONGO_URI);
        if(conn){
            
            return console.log(`MongoDB Connected`)
        }
    }catch(error){
        console.log(`Error Message: ${error.message}`);
    }
}
export default connectDb;
