import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import FlowwAiUser from "../../Models/UserSchema.js"

const userLogin = async(req,res)=>{
    try{
        const {email,password} = req.body 
        if(!email || !password){
            return res.status(400).json({status:"fail",message:"All Fields are Required"})
        }
        const findUser = await FlowwAiUser.findOne({email:email})
        if(!findUser) return res.status(401).json({status:"fail",message:'email not exist please register'})
        const validatePassword = await bcrypt.compare(password,findUser.password)
        if(!validatePassword){
            return res.status(401).json({status:"fail",message:'entered wrong password'})
        } 
        const token = jwt.sign({ id: findUser._id }, process.env.JWT_SECRET_KEY, { expiresIn: '1d' });  
        return res.status(200).json({token:token})
    }
    catch(error){
        return res.status(500).json({status:"fail",message:error.message})
    }
}

export default userLogin