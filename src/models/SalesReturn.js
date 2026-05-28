import mongoose from "mongoose";

const salesReturnSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },
    invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: "Invoice", required: true, index: true },
    invoiceNo: { type: String, required: true },
    medicineId: { type: mongoose.Schema.Types.ObjectId, ref: "Medicine", required: true },
    medicineName: { type: String, required: true },
    batchId: { type: mongoose.Schema.Types.ObjectId, ref: "MedicineBatch", required: true },
    batchNo: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    refundAmount: { type: Number, required: true, min: 0 },
    reason: { type: String, required: true },
    processedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    processedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model("SalesReturn", salesReturnSchema);
