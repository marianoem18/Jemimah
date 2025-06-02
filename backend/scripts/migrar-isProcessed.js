require('dotenv').config();
const mongoose = require('mongoose');
const Sale = require('../models/sale');
const Expense = require('../models/expense');

async function migrate() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    await Promise.all([
      Sale.updateMany({ isProcessed: { $exists: false } }, { $set: { isProcessed: false } }),
      Expense.updateMany({ isProcessed: { $exists: false } }, { $set: { isProcessed: false } }),
    ]);

    console.log('Migration completed: isProcessed field added to Sale and Expense documents');
    await mongoose.disconnect();
  } catch (err) {
    console.error('Migration failed:', err);
    await mongoose.disconnect();
  }
}

migrate();