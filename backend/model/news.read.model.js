import mongoose, { Schema } from 'mongoose';

const dailyNewsCountSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true,
    },
    count: {
        type: Number,
        default: 0,
    },
});

const monthNewsCountSchema = new mongoose.Schema({
    month: {
        type: Number,
        required: true,
    },
    year: {
        type: Number,
        required: true,
    },
    days: [dailyNewsCountSchema],
});

const MonthNewsCount = mongoose.model('MonthNewsCount', monthNewsCountSchema);

export default MonthNewsCount;
