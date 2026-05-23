import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "ClinicPatient", required: true },
    doctorName: String,
    appointmentDate: Date,
    status: { type: String, default: "Scheduled" },
    notes: String,
    followUpReminder: String,
  },
  { timestamps: true }
);

export default mongoose.model("Appointment", appointmentSchema);
