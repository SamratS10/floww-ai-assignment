import Category from "../../Models/CategorySchema.js";

// Create a new category
export const createCategory = async (req, res) => {
    try {
        const { name, type } = req.body;

        // Validate the input type (should be either 'income' or 'expense')
        if (!['income', 'expense'].includes(type)) {
            return res.status(400).json({status:"fail", message: 'Invalid category type. Must be either income or expense.' });
        }

        // Check if the category already exists
        const categoryExists = await Category.findOne({ name, type,user: req.user._id });
        if (categoryExists) {
            return res.status(400).json({status:"fail", message: 'Category already exists.' });
        }

        // Create and save the new category
        const category = new Category({ name, type,user: req.user._id });
        await category.save();

        res.status(201).json({status: "success",category}); // Return the created category
    } catch (error) {
        return res.status(500).json({status:"fail", message: error.message });
    }
};

// Get all categories (optional filtering by type)
export const getCategories = async (req, res) => {
    try {
        const { type } = req.query;

        //let filter = {};
        let filter = { user: req.user._id };
        if (type) {
            // Ensure type is valid if provided in query string
            if (!['income', 'expense'].includes(type)) {
                return res.status(400).json({ status:"fail",message: 'Invalid category type. Must be either income or expense.' });
            }
            filter.type = type;
        }

        // Find categories with optional type filter
        const categories = await Category.find(filter);
        return res.status(200).json({status: "success",categories}); // Return all categories
    } catch (error) {
        return res.status(500).json({status:"fail", message: error.message });
    }
};

// Delete a category by ID
export const deleteCategory = async (req, res) => {
    try {
        // Find and delete the category by ID
        const category = await Category.findByIdAndDelete({_id:req.params.id,user: req.user._id });

        if (!category) {
            return res.status(404).json({status:"fail", message: 'Category not found' });
        }

        return res.status(200).json({status: "success", message: 'Category deleted successfully' });
    } catch (error) {
        return res.status(500).json({status:"fail", message: error.message });
    }
};
