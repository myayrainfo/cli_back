import mongoose from "mongoose";

const medicineSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },
    name: { type: String, required: true },
    category: String,
    company: String,
    genericName: String,
    composition: String,
    mrp: { type: Number, default: 0 },
    purchasePrice: { type: Number, default: 0 },
    sellingPrice: { type: Number, default: 0 },
    gst: { type: Number, default: 0 },
    discountRule: { type: String, default: "" },
    rackLocation: String,
    barcodeValue: String,
    imageUrl: String,
    minimumStock: { type: Number, default: 0 },
    substituteSuggestions: [{ type: String }],
  },
  { timestamps: true }
);

export default mongoose.model("Medicine", medicineSchema);
