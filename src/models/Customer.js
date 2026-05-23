import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },
    name: { type: String, required: true },
    phone: String,
    address: String,
    dueAmount: { type: Number, default: 0 },
    loyaltyPoints: { type: Number, default: 0 },
    regularCustomerDiscount: { type: Number, default: 0 },
    chronicTracking: { type: Boolean, default: false },
    reminderPreference: { type: String, default: "WhatsApp/SMS placeholder" },
  },
  { timestamps: true }
);

export default mongoose.model("Customer", customerSchema);
