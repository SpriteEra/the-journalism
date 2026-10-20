import mongoose from "mongoose";

const updateStackSchema = new mongoose.Schema(
    {
        relatedId: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: "type", // Reference depends on type
        },
        type: {
            type: String,
            required: true,
            enum: ["News", 'YtNews', 'User', 'AnonymousNews', 'EventNews', 'GalleryNews', 'LiveNews', 'ShortVideo'],
        },
        updates: [
            {
                updatedBy: {
                    type: mongoose.Schema.Types.ObjectId,
                    // required: true,
                    refPath: "updates.$.updatedByModel", // Dynamic ref path based on sibling field
                },
                updatedByModel: {
                    type: String,
                    // required: true,
                    enum: ["User"],
                },
                updatedAt: {
                    type: Date,
                    default: Date.now,
                },
                description: {
                    type: String,
                },
            },
        ],
    },
    { timestamps: true }
);

const UpdateStack = mongoose.model("UpdateStack", updateStackSchema);

export default UpdateStack;
