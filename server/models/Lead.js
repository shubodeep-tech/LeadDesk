const mongoose = require('mongoose');

const BUDGET_RANGES =[
  "Under 5,000",
  "5,000-10,000",
  "10,000-20,000",
  "20,000-30,000",
  "30,000+"
]

const STATUSES = ['New', 'Contacted', 'Closed'];

const leadSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
    },
    budgetRange: {
      type: String,
      required: [true, 'Budget range is required'],
      enum: { values: BUDGET_RANGES, message: 'Invalid budget range' },
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
      minlength: [10, 'Message must be at least 10 characters'],
      maxlength: [2000, 'Message cannot exceed 2000 characters'],
    },
    status: {
      type: String,
      enum: { values: STATUSES, message: 'Invalid status' },
      default: 'New',
    },
  },
  { timestamps: true }
);

leadSchema.index({ name: 'text', email: 'text', message: 'text' });
leadSchema.index({ status: 1 });
leadSchema.index({ createdAt: -1 });

const Lead = mongoose.model('Lead', leadSchema);
module.exports = Lead;
module.exports.BUDGET_RANGES = BUDGET_RANGES;
module.exports.STATUSES = STATUSES;
