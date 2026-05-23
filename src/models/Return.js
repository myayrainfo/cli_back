import mongoose from "mongoose";

const returnSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },
    type: { type: String, enum: ["SALE_RETURN", "PURCHASE_RETURN"], required: true },
    referenceId: { type: mongoose.Schema.Types.ObjectId, required: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier" },
    amount: { type: Number, default: 0 },
    reason: String,
    status: { type: String, default: "Placeholder" },
  },
  { timestamps: true }
);

export default mongoose.model("Return", returnSchema);
