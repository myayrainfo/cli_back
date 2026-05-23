import mongoose from "mongoose";

const clinicPatientSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },
    name: { type: String, required: true },
    phone: String,
    age: Number,
    gender: String,
    address: String,
    medicalHistory: String,
  },
  { timestamps: true }
);

export default mongoose.model("ClinicPatient", clinicPatientSchema);
