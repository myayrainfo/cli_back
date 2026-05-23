import mongoose from "mongoose";

const purchaseItemSchema = new mongoose.Schema(
  {
    medicineId: { type: mongoose.Schema.Types.ObjectId, ref: "Medicine", required: true },
    batchId: { type: mongoose.Schema.Types.ObjectId, ref: "MedicineBatch" },
    medicineName: String,
    batchNumber: String,
    manufacturingDate: Date,
    expiryDate: Date,
    quantity: { type: Number, required: true },
    purchasePrice: Number,
    mrp: Number,
    sellingPrice: Number,
    gst: Number,
    lineTotal: Number,
  },
  { _id: false }
);

const purchaseSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },
    purchaseNumber: { type: String, required: true, unique: true },
    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier", required: true },
    supplierName: String,
    items: [purchaseItemSchema],
    subtotal: { type: Number, default: 0 },
    gstTotal: { type: Number, default: 0 },
    grandTotal: { type: Number, default: 0 },
    amountPaid: { type: Number, default: 0 },
    amountDue: { type: Number, default: 0 },
    paymentStatus: {
      type: String,
      enum: ["Paid", "Partial", "Due"],
      default: "Paid",
    },
    purchaseDate: { type: Date, default: Date.now },
    notes: String,
  },
  { timestamps: true }
);

export default mongoose.model("Purchase", purchaseSchema);
