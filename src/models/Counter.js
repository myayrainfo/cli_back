import mongoose from "mongoose";

const counterSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },
    key: { type: String, required: true },
    year: { type: Number, required: true },
    sequence: { type: Number, default: 0 },
  },
  { timestamps: true }
);

counterSchema.index({ tenantId: 1, key: 1, year: 1 }, { unique: true });

export default mongoose.model("Counter", counterSchema);
