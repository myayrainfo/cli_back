import mongoose from "mongoose";

const prescriptionSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "ClinicPatient", required: true },
    doctorName: String,
    diagnosis: String,
    medicines: [{ name: String, dosage: String, duration: String }],
    labTests: [
      {
        type: {
          type: String,
          required: true,
          trim: true,
        },
        status: {
          type: String,
          enum: ["Pending", "Completed"],
          default: "Pending",
        },
        result: {
          type: String,
          default: "",
        },
      },
    ],
    issuedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model("Prescription", prescriptionSchema);
