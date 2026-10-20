import mongoose, { Schema } from "mongoose";

const galleryNewsSchema = new mongoose.Schema(
  {
    news_id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    location: { type: String, },
    description: { type: String, },
    photos: [
      {
        title: { type: String, required: true },
        description: { type: String, required: true },
        image: { type: String, required: true }, // URL/path of photo
      },
    ],
    post_time: {
      type: Date,
    },
    author: { type: Schema.Types.ObjectId, ref: "User" },
    ref_reporter: {
      type: String,
    },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
    tags: [{
      type: String,
      trim: true
    }],
    activity: {
      total_reads: { type: Number, default: 0 },
      total_today_count: { type: Number, default: 0 },
    },
    draft: { type: Boolean, default: false },
    isPublished: { type: Boolean, default: false },
    isDeleted: {
      default: false,
      type: Boolean,
    },
    update_stack: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UpdateStack',
      required: true,
    },
  },
  { timestamps: true }
);

galleryNewsSchema.index({ draft: 1 });
galleryNewsSchema.index({ createdAt: 1 }); // createdAt is added by timestamps:true

const GalleryNews = mongoose.model("GalleryNews", galleryNewsSchema);
export default GalleryNews;
