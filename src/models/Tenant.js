import mongoose from "mongoose";

const tenantSchema = new mongoose.Schema(
  {
    storeName: { type: String, required: true },
    ownerName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: String,
    address: String,
    gstNumber: String,
    planName: { type: String, default: "Starter" },
    paymentStatus: { type: String, default: "Trial" },
    invoicePrefix: { type: String, default: "ARYA" },
    settings: {
      gstPercentage: { type: Number, default: 12 },
      invoiceTemplate: { type: String, default: "Classic" },
      defaultDiscount: { type: Number, default: 0 },
      medicineCategories: [{ type: String }],
      racks: [{ type: String }],
      backupEnabled: { type: Boolean, default: false },
      branches: [{ name: String, address: String }],
    },
  },
  { timestamps: true }
);

export default mongoose.model("Tenant", tenantSchema);
