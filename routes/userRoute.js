import express from "express";
import userLogin from "../controllers/userController/login.js";
import userRegister from "../controllers/userController/register.js";


const router = express.Router() 


router.post('/register',userRegister) 
router.post('/login',userLogin) 

export default router