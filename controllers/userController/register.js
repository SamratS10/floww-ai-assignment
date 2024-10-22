import FlowwAiUser from '../../Models/UserSchema.js'
import validatePassword from '../../config/validatePassword.js'
import hashPassword from '../../config/hashPassword.js'



const userRegister = async(req,res)=>{
    try{
        const {name,email,password} = req.body 
        if(!name || !email || !password){
            return res.status(400).json({status:"fail",message:"All fields are required"})
        }
        const userExist = await FlowwAiUser.findOne({email:email})

        if(userExist){
            return res.status(400).json({status:"fail",message:"Email registered please login"})
        }

        const passwordValidation = validatePassword(password)
        if(!passwordValidation){
            return res.status(401).json({status:"fail",message:"password should have atleast 6 characters"})
        }

        const bcryptPassword = await hashPassword(password)
        const user = await FlowwAiUser.create({name:name,email:email,password:bcryptPassword})
        if(!user){
            return res.status(401).json({status:"fail",message:"invalid details"})
        }
        return res.status(201).json({status:"success",message:"User registered successfully"})
    }
    catch(error){
        return res.status(500).json({status:"fail",message:error.message})
    }
}

export default userRegister