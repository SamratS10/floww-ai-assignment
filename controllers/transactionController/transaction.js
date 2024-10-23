import Transaction from "../../Models/TransactionSchema.js";
import Category from "../../Models/CategorySchema.js";

// Create a new transaction
export const createTransaction = async (req, res) => {
    try {
        const { type, category, amount, description, date } = req.body;

        if (!type || !category || !amount || !description || amount <= 0) {
            return res.status(400).json({ status: "fail", message: 'All fields are required and amount must be greater than 0' });
        }

        // Validate if the category exists in the database by name and type
        const categoryExists = await Category.findOne({ name: category, type });
        if (!categoryExists) {
            return res.status(404).json({ status: "fail", message: 'Category not found' });
        }

        // Create a new transaction linked to the authenticated user
        const transaction = new Transaction({
            user: req.user._id, // Associate with authenticated user
            type,
            category: categoryExists._id, // Store the category ID in the transaction
            amount,
            description,
            date: date || Date.now() // Use current date if no date is provided
        });

        await transaction.save();
        return res.status(201).json({ status: "success", data: transaction });
    } catch (error) {
        return res.status(500).json({ status: "fail", message: error.message });
    }
};


// Get all transactions for the authenticated user with pagination
export const getTransactions = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query; // Default page 1, limit 10

        // Find transactions associated with the current user, and apply pagination
        const transactions = await Transaction.find({ user: req.user._id })
            .populate('category') // Populate category details
            .limit(limit * 1) // Limit the number of results
            .skip((page - 1) * limit); // Skip transactions according to the page number

        // Get the total number of transactions for the authenticated user
        const total = await Transaction.countDocuments({ user: req.user._id });

        res.status(200).json({
            status: "success",
            data: transactions,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
        });
    } catch (error) {
        res.status(500).json({ status: "fail", message: error.message });
    }
};

export const getTransactionById = async (req, res) => {
    try {
        // Find the transaction by ID and ensure it belongs to the current user
        const transaction = await Transaction.findOne({ _id: req.params.id, user: req.user._id }).populate('category');

        if (!transaction) {
            return res.status(404).json({ status: "fail", message: 'Transaction not found' });
        }

        return res.status(200).json({ status: "success", data: transaction });
    } catch (error) {
        return res.status(500).json({ status: "fail", message: error.message });
    }
};

// Update an existing transaction
export const updateTransaction = async (req, res) => {
    try {
        const { type, category, amount, description, date } = req.body;

        // Validate if the category exists by name and type
        const categoryExists = await Category.findOne({ name: category, type });
        if (!categoryExists) {
            return res.status(404).json({ status: "fail", message: 'Category not found' });
        }

        // Update the transaction with the new details
        const transaction = await Transaction.findOneAndUpdate(
            { _id: req.params.id, user: req.user._id },
            {
                type,
                category: categoryExists._id, // Use the category's ID
                amount,
                description,
                date: date || Date.now(),
            },
            { new: true, runValidators: true }
        );

        if (!transaction) {
            return res.status(404).json({ status: "fail", message: 'Transaction not found' });
        }

        return res.status(200).json({ status: "success", data: transaction });
    } catch (error) {
        return res.status(500).json({ status: "fail", message: error.message });
    }
};

export const deleteTransaction = async (req, res) => {
    try {
        // Find the transaction by ID and ensure it belongs to the current user
        const transaction = await Transaction.findOneAndDelete({ _id: req.params.id, user: req.user._id });

        if (!transaction) {
            return res.status(404).json({ status: "fail", message: 'Transaction not found' });
        }

        return res.status(200).json({ status: "success", message: 'Transaction deleted successfully' });
    } catch (error) {
        return res.status(500).json({ status: "fail", message: error.message });
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

        return res.status(200).json({ status: "success", data: summary });
    } catch (error) {
        return res.status(500).json({ status: "fail", message: error.message });
    }
};

// Get monthly spending report by category for the authenticated user
export const getMonthlyReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        // Validate that both startDate and endDate are provided
        if (!startDate || !endDate) {
            return res.status(400).json({ status: "fail", message: "Both startDate and endDate are required for the report" });
        }

        // Convert string dates to actual Date objects
        const start = new Date(startDate);
        const end = new Date(endDate);

        // Validate that the provided dates are valid
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(400).json({ status: "fail", message: "Invalid date format" });
        }

        // Ensure endDate is greater than or equal to startDate
        if (end < start) {
            return res.status(400).json({ status: "fail", message: "End date must be after start date" });
        }

        // Aggregate transactions by category within the given date range
        const report = await Transaction.aggregate([
            {
                $match: {
                    user: req.user._id, // Filter by authenticated user
                    date: { $gte: start, $lte: end }, // Filter by date range
                },
            },
            {
                $group: {
                    _id: "$category", // Group by category field (ObjectId reference)
                    totalSpent: { $sum: "$amount" }, // Sum the amounts spent
                },
            },
            {
                $lookup: {
                    from: "categories", // Lookup details from the 'categories' collection
                    localField: "_id", // Use the _id from the group (category ObjectId)
                    foreignField: "_id", // Match it with the _id in the Category collection
                    as: "categoryDetails",
                },
            },
            { $unwind: "$categoryDetails" }, // Flatten the lookup result to show category details
            {
                $project: {
                    categoryName: "$categoryDetails.name", // Show the category name
                    totalSpent: 1, // Show total spent
                    type: "$categoryDetails.type", // Show whether it's income or expense
                },
            },
        ]);

        return res.status(200).json({ status: "success", data: report });
    } catch (error) {
        return res.status(500).json({ status: "fail", message: error.message });
    }
};

