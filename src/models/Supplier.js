import mongoose from "mongoose";

const supplierSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },
    name: { type: String, required: true },
    phone: String,
    email: String,
    address: String,
    paymentDue: { type: Number, default: 0 },
    gstNumber: String,
    contactPerson: String,
    companiesSupplied: [{ type: String }],
    performance: { type: String, default: "Reliable" },
  },
  { timestamps: true }
);

export default mongoose.model("Supplier", supplierSchema);
