import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['income', 'expense'],
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FlowwAiUser', // Link to the User model
        required: true,
    }
},{timestamps:true});

const Category = mongoose.model('Category', categorySchema);
export default Category