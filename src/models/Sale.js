import mongoose from "mongoose";

const saleSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },
    invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: "Invoice", required: true, index: true },
    invoiceNo: { type: String, required: true, index: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
    customerName: String,
    medicineId: { type: mongoose.Schema.Types.ObjectId, ref: "Medicine", required: true, index: true },
    medicineName: { type: String, required: true },
    genericName: String,
    company: String,
    batchId: { type: mongoose.Schema.Types.ObjectId, ref: "MedicineBatch", required: true },
    batchNo: { type: String, required: true },
    expiry: Date,
    quantity: { type: Number, required: true, min: 1 },
    mrp: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    gstPercent: { type: Number, default: 0 },
    gstAmount: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    soldAt: { type: Date, default: Date.now },
    returnedQuantity: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model("Sale", saleSchema);
