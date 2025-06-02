const mongoose = require('mongoose');

const reportStatusSchema = new mongoose.Schema({
  lastGenerated: { type: Date, default: Date.now },
});

module.exports = mongoose.model('ReportStatus', reportStatusSchema);
