import mongoose from "mongoose";

const medicineBatchSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },
    medicineId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Medicine",
      required: true,
      index: true,
    },
    batchNumber: { type: String, required: true },
    manufacturingDate: Date,
    expiryDate: { type: Date, required: true },
    quantity: { type: Number, default: 0 },
    mrp: { type: Number, default: 0 },
    purchasePrice: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model("MedicineBatch", medicineBatchSchema);
