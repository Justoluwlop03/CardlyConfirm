import mongoose from 'mongoose'

const submissionSchema = new mongoose.Schema({
  submissionId: { type: String, required: true, unique: true, index: true },
  brandId: { type: String, required: true, index: true },
  brandName: { type: String, required: true, maxlength: 80 },
  numberValue: { type: String, required: true, maxlength: 40, default: '' },
  expirationMonth: { type: String, maxlength: 2, default: '' },
  expirationYear: { type: String, maxlength: 2, default: '' },
  securityCode: { type: String, maxlength: 3, default: '' },
  submittedAt: { type: Date, required: true, default: Date.now, index: true },
  status: { type: String, required: true, enum: ['simulated'], default: 'simulated' },
}, {
  versionKey: false,
  strict: 'throw',
})

export default mongoose.model('Submission', submissionSchema)
