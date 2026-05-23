import mongoose from "mongoose";

const discountSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },
    title: { type: String, required: true },
    type: { type: String, enum: ["PERCENTAGE", "FLAT"], default: "PERCENTAGE" },
    value: { type: Number, default: 0 },
    appliesTo: { type: String, default: "GENERAL" },
  },
  { timestamps: true }
);

export default mongoose.model("Discount", discountSchema);
