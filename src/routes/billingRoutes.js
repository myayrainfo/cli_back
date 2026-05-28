import { Router } from "express";
import {
  createBillingInvoice,
  createSale,
  getDues,
  getInvoice,
  getInvoiceByInvoiceNumber,
  getInvoicePdf,
  getInvoices,
  getSales,
  payDue,
  processSalesReturn,
} from "../controllers/billingController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

router.use(protect);
router.get("/sales", getSales);
router.post("/sales", createSale);
router.post("/create", createBillingInvoice);
router.get("/invoices", getInvoices);
router.get("/invoices/number/:invoiceNo", getInvoiceByInvoiceNumber);
router.get("/invoices/:id/pdf", getInvoicePdf);
router.get("/invoices/:id", getInvoice);
router.get("/dues", getDues);
router.post("/dues/:id/pay", payDue);
router.post("/returns", processSalesReturn);

export default router;
