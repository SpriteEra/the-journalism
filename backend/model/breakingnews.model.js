import mongoose from "mongoose";
const newsSchema = new mongoose.Schema({
    title: {
        type: String,
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    }
}, { timestamps: true });
const BreakingNews = mongoose.model("breakingNews", newsSchema);

export default BreakingNews;