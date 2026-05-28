import mongoose from "mongoose";

const dueCollectionSchema = new mongoose.Schema(
  {
    amount: { type: Number, required: true, min: 0 },
    paymentMode: {
      type: String,
      enum: ["Cash", "UPI", "Card", "Split Payment"],
      required: true,
    },
    transactionRef: String,
    collectedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const dueSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },
    invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: "Invoice", required: true, index: true },
    invoiceNo: { type: String, required: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
    customerName: String,
    customerMobile: String,
    grandTotal: { type: Number, required: true, min: 0 },
    paidAmount: { type: Number, default: 0, min: 0 },
    dueAmount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["Open", "Closed"],
      default: "Open",
    },
    collections: { type: [dueCollectionSchema], default: [] },
    closedAt: Date,
  },
  { timestamps: true }
);

export default mongoose.model("Due", dueSchema);
