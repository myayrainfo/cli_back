import { Router } from "express";
import {
  createAppointment,
  createPatient,
  createPrescription,
  deleteAppointment,
  deletePatient,
  deletePrescription,
  getAppointments,
  getPatients,
  getPrescriptions,
  updateAppointment,
  updatePatient,
  updatePrescription,
} from "../controllers/clinicController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

router.use(protect);
router.get("/patients", getPatients);
router.post("/patients", createPatient);
router.put("/patients/:id", updatePatient);
router.delete("/patients/:id", deletePatient);

router.get("/appointments", getAppointments);
router.post("/appointments", createAppointment);
router.put("/appointments/:id", updateAppointment);
router.delete("/appointments/:id", deleteAppointment);

router.get("/prescriptions", getPrescriptions);
router.post("/prescriptions", createPrescription);
router.put("/prescriptions/:id", updatePrescription);
router.delete("/prescriptions/:id", deletePrescription);

export default router;
