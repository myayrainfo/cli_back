import mongoose from "mongoose";

const stockMovementSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },
    medicineId: { type: mongoose.Schema.Types.ObjectId, ref: "Medicine", required: true },
    batchId: { type: mongoose.Schema.Types.ObjectId, ref: "MedicineBatch" },
    type: {
      type: String,
      enum: ["IN", "OUT", "ADJUSTMENT"],
      required: true,
    },
    quantity: { type: Number, required: true },
    reason: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export default mongoose.model("StockMovement", stockMovementSchema);
