import bcrypt from 'bcrypt'
const hashPassword = async(password)=>{
    const salt = await bcrypt.genSalt(11)
    const bcryptPassword = await bcrypt.hash(password,salt)
    return bcryptPassword
}

export default hashPassword