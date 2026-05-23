import mongoose from "mongoose";

const saleItemSchema = new mongoose.Schema(
  {
    medicineId: { type: mongoose.Schema.Types.ObjectId, ref: "Medicine", required: true },
    batchId: { type: mongoose.Schema.Types.ObjectId, ref: "MedicineBatch", required: true },
    medicineName: String,
    batchNumber: String,
    expiryDate: Date,
    quantity: { type: Number, required: true },
    mrp: Number,
    discount: { type: Number, default: 0 },
    gst: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
  },
  { _id: false }
);

const saleSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },
    invoiceNumber: { type: String, required: true, unique: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
    customerName: String,
    items: [saleItemSchema],
    subtotal: { type: Number, default: 0 },
    discountTotal: { type: Number, default: 0 },
    gstTotal: { type: Number, default: 0 },
    grandTotal: { type: Number, default: 0 },
    paymentMethod: { type: String, default: "Cash" },
    paymentStatus: {
      type: String,
      enum: ["Paid", "Partial", "Due"],
      default: "Paid",
    },
    amountPaid: { type: Number, default: 0 },
    amountDue: { type: Number, default: 0 },
    saleDate: { type: Date, default: Date.now },
    notes: String,
  },
  { timestamps: true }
);

export default mongoose.model("Sale", saleSchema);
