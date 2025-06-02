
require('dotenv').config({ path: 'C:\\Users\\celes\\jemimah_kids\\backend\\.env' });
const mongoose = require('mongoose');
const moment = require('moment-timezone');
const Expense = require('../models/expense');

async function migrate() {
  try {
    console.log('MONGO_URI:', process.env.mongo_uri); // Debug line to verify URI
    if (!process.env.mongo_uri) {
      throw new Error('mongo_uri is not defined in .env file');
    }

    await mongoose.connect(process.env.mongo_uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    const expenses = await Expense.find({});
    let updatedCount = 0;

    for (const expense of expenses) {
      let needsUpdate = false;

      // Add createdAt if missing
      if (!expense.createdAt) {
        expense.createdAt = expense.date;
        needsUpdate = true;
      }

      // Update date to include timestamp (set to midnight in Argentina)
      const dateStr = expense.date.toISOString().split('T')[0];
      const newDate = moment.tz(dateStr, 'America/Argentina/Buenos_Aires').startOf('day').toDate();
      if (expense.date.toISOString() !== newDate.toISOString()) {
        expense.date = newDate;
        needsUpdate = true;
      }

      if (needsUpdate) {
        await expense.save();
        updatedCount++;
      }
    }

    console.log(`Migration completed: updated ${updatedCount} expenses with createdAt and timestamped date`);
    await mongoose.disconnect();
  } catch (err) {
    console.error('Migration failed:', err.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

migrate();