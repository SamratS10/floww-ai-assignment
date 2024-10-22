import express from "express";
import cors from "cors" 
import dotenv from 'dotenv'
import { connectDb } from "./config/db.js";
import router from "./routes/userRoute.js";

dotenv.config()

const app = express();
app.use(express.json())
app.use(cors())
app.use('/api/v1',router)

const port = process.env.PORT || 8001 

app.listen(port,()=>console.log(`App is listening to port ${port}`))
connectDb()

