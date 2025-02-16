import mongoose from "mongoose";

export const connectDb = async()=>{
    try{
        await mongoose.connect(process.env.MONGO_URL)
        console.log("Connected to database")
    }
    catch(err){
        console.log(err.message)
    }
}