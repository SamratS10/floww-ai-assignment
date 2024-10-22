import jwt from 'jsonwebtoken'
import FlowwAiUser from '../Models/UserSchema.js'
const authUser = async(req,res,next)=>{
    try{
    const authHeader = req.headers["authorization"]
    let token 
    if(authHeader!==undefined){
        token = authHeader.split(" ")[1]
    }
    if(token===undefined){
        return res.status(401).json({status:'fail',message:"Please Login in"})
    }
    const decoded = jwt.verify(token,process.env.JWT_SECRET_KEY)
    if(!decoded){
        return res.status(401).json({status:'fail',message:"Token is invalid or token expired"})
    }
    const {id} = decoded 
    req.user = await FlowwAiUser.findById({_id:id}).select('-password')
    next()
}
    catch(error){
        return res.status(500).json({status:'fail',message:"something went wrong"})
    }

}

export default authUser