import mongoose from "mongoose";

const splitPaymentSchema = new mongoose.Schema(
  {
    mode: {
      type: String,
      enum: ["Cash", "UPI", "Card"],
      required: true,
    },
    amount: { type: Number, required: true, min: 0 },
    transactionRef: String,
  },
  { _id: false }
);

const paymentSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },
    invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: "Invoice", required: true, index: true },
    dueId: { type: mongoose.Schema.Types.ObjectId, ref: "Due" },
    invoiceNo: { type: String, required: true },
    paymentMode: {
      type: String,
      enum: ["Cash", "UPI", "Card", "Split Payment"],
      required: true,
    },
    paidAmount: { type: Number, required: true, min: 0 },
    dueAmount: { type: Number, required: true, min: 0 },
    paymentStatus: {
      type: String,
      enum: ["Paid", "Partial", "Due"],
      required: true,
    },
    transactionRef: String,
    splitPayments: { type: [splitPaymentSchema], default: [] },
    paymentStage: {
      type: String,
      enum: ["Invoice", "DueCollection"],
      default: "Invoice",
    },
    paidAt: { type: Date, default: Date.now },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export default mongoose.model("Payment", paymentSchema);
