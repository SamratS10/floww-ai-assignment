import express from "express";
import userLogin from "../controllers/userController/login.js";
import userRegister from "../controllers/userController/register.js";
import { createCategory, deleteCategory, getCategories, getCategoryById, updateCategory } from "../controllers/categoryController/Category.js";
import authUser from "../middlewares/auth.js";
import { createTransaction, deleteTransaction, getMonthlyReport, getSummary, getTransactionById, getTransactions, updateTransaction } from "../controllers/transactionController/transaction.js";

const router = express.Router() 


router.post('/register',userRegister) 
router.post('/login',userLogin) 

//CATEGORY routes
router.post('/categories/create',authUser,createCategory)
router.get('/category/get-categories',authUser,getCategories)
router.get('/category/get-categorie/:id',authUser,getCategoryById)
router.put('/category/update/:id',authUser,updateCategory)
router.delete('/category/delete/:id',authUser,deleteCategory)

//TRANSACTION routes 
router.post('/transaction/create',authUser,createTransaction)
router.get('/transaction/get-trans',authUser,getTransactions)
router.get('/transaction/get-transc-id/:id',authUser,getTransactionById)
router.put('/transaction/update/:id',authUser,updateTransaction)
router.delete('/transaction/delete/:id',authUser,deleteTransaction)

// Get a summary of transactions for the authenticated user (income, expenses, balance)
router.get('/transactions/summary',authUser, getSummary)

// Get monthly spending report by category for the authenticated user
router.get('/transactions/report',authUser, getMonthlyReport)




export default router