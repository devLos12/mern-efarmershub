import mongoose from "mongoose";



const damageLogSchema = new mongoose.Schema({
  rider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Rider',
    required: true
  },
  order: {
    type: String,
    ref: 'Order',
    required: true
  },
  itemDamaged: {
    type: String,
    required: true
  },
  damageValue: {
    type: Number,
    required: true
  },
  riderLiability: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'deducted'],
    default: 'pending'
  },
  notes: String
}, {
  timestamps: true
});

const DamageLog = mongoose.model('DamageLog', damageLogSchema);
export default DamageLog;