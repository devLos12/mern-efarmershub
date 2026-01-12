import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema({
  // Who performed the action
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  
  adminType: {
    type: String,
    enum: ['main', 'sub'],
    required: true
  },
  
  // Simple action description
  action: {
    type: String,
    required: true
    // No enum, pwedeng kahit ano para flexible
  },
  
  // Description of what happened
  description: {
    type: String,
    required: true
  },
  
  // Request info for login tracking
  ipAddress: {
    type: String
  },
  
  userAgent: {
    type: String
  },
  
  // Success or failed
  status: {
    type: String,
    enum: ['success', 'failed'],
    default: 'success'
  }
  
}, {
  timestamps: true
});

// Indexes
activityLogSchema.index({ performedBy: 1, createdAt: -1 });
activityLogSchema.index({ createdAt: -1 });

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema, 'activity_logs');

export default ActivityLog;