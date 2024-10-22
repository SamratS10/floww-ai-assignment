import Transaction from "../../Models/TransactionSchema.js";
import Category from "../../Models/CategorySchema.js";


// Create a new transaction
export const createTransaction = async (req, res) => {
    try {
        // Destructure input data from request body
        const { type, category, amount, description, date } = req.body;
        if(!type || !category || !amount || !description){
            return res.status(400).json({status:"fail", message: 'All Fields of Transaction are required' });
        }

        // Validate if the category exists in the database
        const categoryExists = await Category.findById(category);
        if (!categoryExists) {
            return res.status(404).json({status:"fail", message: 'Category not found' });
        }

        // Ensure category type matches transaction type (e.g., income category with income transaction)
        if (categoryExists.type !== type) {
            return res.status(400).json({ message: `Category type mismatch. Expected ${categoryExists.type} category.` });
        }

        // Create a new transaction for the authenticated user
        const transaction = new Transaction({
            user: req.user._id, // Associate the transaction with the current authenticated user
            type,
            category,
            amount,
            description,
            date: date || Date.now() // If no date is provided, use the current date
        });

        await transaction.save();
        res.status(201).json(transaction); // Return the created transaction
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get all transactions for the authenticated user
export const getTransactions = async (req, res) => {
    try {
        // Find transactions associated with the current user, populate category details
        const transactions = await Transaction.find({ user: req.user._id }).populate('category');
        res.json(transactions); // Return all transactions
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get a specific transaction by ID for the authenticated user
export const getTransactionById = async (req, res) => {
    try {
        // Find transaction by ID and ensure it belongs to the current user
        const transaction = await Transaction.findOne({ _id: req.params.id, user: req.user._id }).populate('category');

        if (!transaction) {
            return res.status(404).json({ message: 'Transaction not found' });
        }

        res.json(transaction); // Return the found transaction
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update an existing transaction by ID for the authenticated user
export const updateTransaction = async (req, res) => {
    try {
        const { type, category, amount, description, date } = req.body;

        // Validate if the category exists
        const categoryExists = await Category.findById(category);
        if (!categoryExists) {
            return res.status(404).json({ message: 'Category not found' });
        }

        // Ensure category type matches transaction type
        if (categoryExists.type !== type) {
            return res.status(400).json({ message: `Category type mismatch. Expected ${categoryExists.type} category.` });
        }

        // Find the transaction by ID and ensure it belongs to the current user
        const transaction = await Transaction.findOneAndUpdate(
            { _id: req.params.id, user: req.user._id },
            { type, category, amount, description, date: date || Date.now() }, // Update transaction fields
            { new: true, runValidators: true } // Return the updated document
        );

        if (!transaction) {
            return res.status(404).json({ message: 'Transaction not found' });
        }

        res.json(transaction); // Return the updated transaction
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Delete a transaction by ID for the authenticated user
export const deleteTransaction = async (req, res) => {
    try {
        // Find the transaction by ID and ensure it belongs to the current user
        const transaction = await Transaction.findOneAndDelete({ _id: req.params.id, user: req.user._id });

        if (!transaction) {
            return res.status(404).json({ message: 'Transaction not found' });
        }

        res.json({ message: 'Transaction deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get a summary of transactions for the authenticated user (income, expenses, balance)
export const getSummary = async (req, res) => {
    try {
        const userId = req.user._id;

        // Aggregate transactions to calculate total income, total expenses, and balance
        const transactions = await Transaction.aggregate([
            { $match: { user: userId } }, // Filter transactions by the authenticated user
            {
                $group: {
                    _id: '$type',
                    totalAmount: { $sum: '$amount' }
                }
            }
        ]);

        const summary = {
            income: 0,
            expenses: 0,
            balance: 0
        };

        // Calculate income and expenses
        transactions.forEach(transaction => {
            if (transaction._id === 'income') {
                summary.income = transaction.totalAmount;
            } else if (transaction._id === 'expense') {
                summary.expenses = transaction.totalAmount;
            }
        });

        // Calculate balance (income - expenses)
        summary.balance = summary.income - summary.expenses;

        res.json(summary); // Return the summary
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
