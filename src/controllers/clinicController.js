import Appointment from "../models/Appointment.js";
import ClinicPatient from "../models/ClinicPatient.js";
import Prescription from "../models/Prescription.js";

const scope = (req) => ({ tenantId: req.user.tenantId });

export const getPatients = async (req, res) => {
  res.json(await ClinicPatient.find(scope(req)).sort({ createdAt: -1 }));
};

export const createPatient = async (req, res) => {
  res.status(201).json(await ClinicPatient.create({ ...req.body, tenantId: req.user.tenantId }));
};

export const updatePatient = async (req, res) => {
  const patient = await ClinicPatient.findOneAndUpdate(
    { _id: req.params.id, ...scope(req) },
    req.body,
    { new: true }
  );
  if (!patient) return res.status(404).json({ message: "Patient not found." });
  res.json(patient);
};

export const deletePatient = async (req, res) => {
  await ClinicPatient.findOneAndDelete({ _id: req.params.id, ...scope(req) });
  res.json({ message: "Patient deleted." });
};

export const getAppointments = async (req, res) => {
  res.json(await Appointment.find(scope(req)).sort({ appointmentDate: -1 }));
};

export const createAppointment = async (req, res) => {
  res.status(201).json(await Appointment.create({ ...req.body, tenantId: req.user.tenantId }));
};

export const updateAppointment = async (req, res) => {
  const appointment = await Appointment.findOneAndUpdate(
    { _id: req.params.id, ...scope(req) },
    req.body,
    { new: true }
  );
  if (!appointment) return res.status(404).json({ message: "Appointment not found." });
  res.json(appointment);
};

export const deleteAppointment = async (req, res) => {
  await Appointment.findOneAndDelete({ _id: req.params.id, ...scope(req) });
  res.json({ message: "Appointment deleted." });
};

export const getPrescriptions = async (req, res) => {
  res.json(await Prescription.find(scope(req)).sort({ issuedAt: -1 }));
};

export const createPrescription = async (req, res) => {
  res.status(201).json(await Prescription.create({ ...req.body, tenantId: req.user.tenantId }));
};

export const updatePrescription = async (req, res) => {
  const prescription = await Prescription.findOneAndUpdate(
    { _id: req.params.id, ...scope(req) },
    req.body,
    { new: true }
  );
  if (!prescription) return res.status(404).json({ message: "Prescription not found." });
  res.json(prescription);
};

export const deletePrescription = async (req, res) => {
  await Prescription.findOneAndDelete({ _id: req.params.id, ...scope(req) });
  res.json({ message: "Prescription deleted." });
};
