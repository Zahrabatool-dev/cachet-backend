// Activity log create karne ka helper - kisi bhi controller se call kar sakte hain
const ActivityLog = require('../models/ActivityLog');

const logActivity = async (userId, documentId, action) => {
  try {
    await ActivityLog.create({ userId, documentId, action });
  } catch (error) {
    // logging fail hone se main operation fail nahi honi chahiye, bas console mein error dikhado
    console.error('Activity log failed:', error.message);
  }
};

module.exports = logActivity;