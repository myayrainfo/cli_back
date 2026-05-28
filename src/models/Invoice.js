import mongoose from "mongoose";

const invoiceItemSchema = new mongoose.Schema(
  {
    medicineId: { type: mongoose.Schema.Types.ObjectId, ref: "Medicine", required: true },
    medicineName: { type: String, required: true },
    genericName: String,
    company: String,
    batchId: { type: mongoose.Schema.Types.ObjectId, ref: "MedicineBatch", required: true },
    batchNo: { type: String, required: true },
    expiry: { type: Date, required: true },
    quantity: { type: Number, required: true, min: 1 },
    mrp: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    gstPercent: { type: Number, default: 0, min: 0 },
    grossAmount: { type: Number, required: true, min: 0 },
    taxableAmount: { type: Number, required: true, min: 0 },
    gstAmount: { type: Number, required: true, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    returnedQuantity: { type: Number, default: 0, min: 0 },
    returnedAmount: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const invoiceSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },
    invoiceNo: { type: String, required: true, unique: true, index: true },
    billingType: {
      type: String,
      enum: ["Walk-in", "Registered Customer", "Prescription Based"],
      default: "Walk-in",
    },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
    customerName: { type: String, default: "Walk-in Customer" },
    customerMobile: String,
    doctorName: String,
    prescriptionId: { type: mongoose.Schema.Types.ObjectId, ref: "Prescription" },
    items: { type: [invoiceItemSchema], default: [] },
    subtotal: { type: Number, default: 0 },
    discountTotal: { type: Number, default: 0 },
    gstTotal: { type: Number, default: 0 },
    roundOff: { type: Number, default: 0 },
    grandTotal: { type: Number, default: 0 },
    paidAmount: { type: Number, default: 0 },
    dueAmount: { type: Number, default: 0 },
    paymentMode: { type: String, default: "Cash" },
    paymentStatus: {
      type: String,
      enum: ["Paid", "Partial", "Due"],
      default: "Paid",
    },
    notes: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    returnStatus: {
      type: String,
      enum: ["None", "Partial", "Returned"],
      default: "None",
    },
    refundedAmount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model("Invoice", invoiceSchema);
