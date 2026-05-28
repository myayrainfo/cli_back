import mongoose from "mongoose";
import Counter from "../models/Counter.js";
import Customer from "../models/Customer.js";
import Due from "../models/Due.js";
import Invoice from "../models/Invoice.js";
import Medicine from "../models/Medicine.js";
import MedicineBatch from "../models/MedicineBatch.js";
import Payment from "../models/Payment.js";
import Prescription from "../models/Prescription.js";
import Sale from "../models/Sale.js";
import SalesReturn from "../models/SalesReturn.js";
import StockMovement from "../models/StockMovement.js";
import Tenant from "../models/Tenant.js";

class BillingError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

const PAYMENT_MODES = ["Cash", "UPI", "Card", "Split Payment"];
const CUSTOMER_REQUIRED_BILLING_TYPES = ["Registered Customer", "Prescription Based"];

const roundCurrency = (value) => Number((Number(value) || 0).toFixed(2));

const getPaymentStatus = (paidAmount, grandTotal) => {
  if (paidAmount >= grandTotal) return "Paid";
  if (paidAmount > 0 && paidAmount < grandTotal) return "Partial";
  return "Due";
};

const getBatchStatus = (expiryDate, referenceDate = new Date()) => {
  const expiry = new Date(expiryDate);
  const today = new Date(referenceDate);
  today.setHours(0, 0, 0, 0);

  const nearExpiryDate = new Date(today);
  nearExpiryDate.setDate(nearExpiryDate.getDate() + 90);

  if (expiry < today) return "Expired";
  if (expiry <= nearExpiryDate) return "Near Expiry";
  return "Available";
};

const normalizeSplitPayments = (splitPayments = []) =>
  splitPayments
    .filter((entry) => PAYMENT_MODES.includes(entry.mode) && entry.mode !== "Split Payment")
    .map((entry) => ({
      mode: entry.mode,
      amount: roundCurrency(entry.amount),
      transactionRef: entry.transactionRef || "",
    }))
    .filter((entry) => entry.amount > 0);

const validateBillingPayload = async ({ tenantId, payload, session }) => {
  const {
    billingType = "Walk-in",
    customerId,
    customerName,
    customerMobile,
    doctorName,
    prescriptionId,
    items,
    paidAmount = 0,
    paymentMode = "Cash",
    splitPayments = [],
  } = payload;

  if (!Array.isArray(items) || items.length === 0) {
    throw new BillingError("At least one billing item is required.");
  }

  if (!PAYMENT_MODES.includes(paymentMode)) {
    throw new BillingError("Invalid payment mode selected.");
  }

  if (roundCurrency(paidAmount) < 0) {
    throw new BillingError("Paid amount cannot be negative.");
  }

  if (paymentMode === "Split Payment") {
    const normalizedSplit = normalizeSplitPayments(splitPayments);
    const splitTotal = roundCurrency(
      normalizedSplit.reduce((sum, entry) => sum + entry.amount, 0)
    );

    if (!normalizedSplit.length || splitTotal !== roundCurrency(paidAmount)) {
      throw new BillingError("Split payment amounts must match the paid amount.");
    }
  }

  if (
    CUSTOMER_REQUIRED_BILLING_TYPES.includes(billingType) &&
    !customerId &&
    !customerName?.trim() &&
    !customerMobile?.trim()
  ) {
    throw new BillingError("Customer name or mobile is required for this billing type.");
  }

  if (prescriptionId) {
    const prescription = await Prescription.findOne({ _id: prescriptionId, tenantId }).session(session);
    if (!prescription) {
      throw new BillingError("Prescription not found.", 404);
    }

    if (billingType !== "Prescription Based") {
      throw new BillingError("Prescription can only be linked with prescription-based billing.");
    }
  }

  if (doctorName && !doctorName.trim()) {
    throw new BillingError("Doctor name is invalid.");
  }
};

const calculateLine = ({ quantity, mrp, discount, gstPercent }) => {
  const grossAmount = roundCurrency(quantity * mrp);
  const safeDiscount = roundCurrency(discount);

  if (safeDiscount > grossAmount) {
    throw new BillingError("Discount cannot exceed item total.");
  }

  const taxableAmount = roundCurrency(grossAmount - safeDiscount);
  const gstAmount = roundCurrency((taxableAmount * gstPercent) / 100);
  const totalAmount = roundCurrency(taxableAmount + gstAmount);

  return {
    grossAmount,
    discount: safeDiscount,
    taxableAmount,
    gstAmount,
    totalAmount,
  };
};

const calculateBillTotals = (items) => {
  const subtotal = roundCurrency(items.reduce((sum, item) => sum + item.grossAmount, 0));
  const discountTotal = roundCurrency(items.reduce((sum, item) => sum + item.discount, 0));
  const gstTotal = roundCurrency(items.reduce((sum, item) => sum + item.gstAmount, 0));
  const rawGrandTotal = roundCurrency(items.reduce((sum, item) => sum + item.totalAmount, 0));
  const grandTotal = roundCurrency(Math.round(rawGrandTotal));
  const roundOff = roundCurrency(grandTotal - rawGrandTotal);

  return {
    subtotal,
    discountTotal,
    gstTotal,
    roundOff,
    grandTotal,
  };
};

const buildInvoiceNumber = async ({ tenantId, session }) => {
  const year = new Date().getFullYear();
  const counter = await Counter.findOneAndUpdate(
    { tenantId, key: "invoice", year },
    { $inc: { sequence: 1 } },
    { upsert: true, new: true, setDefaultsOnInsert: true, session }
  );

  return `AYRA-BILL-${year}-${String(counter.sequence).padStart(4, "0")}`;
};

const getCustomerSnapshot = async ({ tenantId, customerId, customerName, customerMobile, session }) => {
  if (!customerId) {
    const trimmedName = customerName?.trim() || "";
    const trimmedMobile = customerMobile?.trim() || "";

    return {
      customerId: null,
      customerName: trimmedName || "Walk-in Customer",
      customerMobile: trimmedMobile,
      hasExplicitCustomerDetails: Boolean(trimmedName || trimmedMobile),
    };
  }

  const customer = await Customer.findOne({ _id: customerId, tenantId }).session(session);
  if (!customer) {
    throw new BillingError("Customer not found.", 404);
  }

  return {
    customerId: customer._id,
    customerName: customer.name,
    customerMobile: customer.phone || customerMobile?.trim() || "",
    hasExplicitCustomerDetails: true,
  };
};

const buildInvoiceItems = async ({ tenantId, items, session }) => {
  const invoiceItems = [];
  const stockAdjustments = [];

  for (const item of items) {
    const quantity = Number(item.quantity);
    const discount = Number(item.discount) || 0;

    if (!item.medicineId || !item.batchId) {
      throw new BillingError("Medicine and batch are required for each item.");
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new BillingError("Item quantity must be greater than zero.");
    }

    const [medicine, batch] = await Promise.all([
      Medicine.findOne({ _id: item.medicineId, tenantId }).session(session),
      MedicineBatch.findOne({ _id: item.batchId, tenantId }).session(session),
    ]);

    if (!medicine) {
      throw new BillingError("Medicine not found.", 404);
    }

    if (!batch || String(batch.medicineId) !== String(medicine._id)) {
      throw new BillingError("Invalid batch selected.");
    }

    const batchStatus = getBatchStatus(batch.expiryDate);
    if (batchStatus === "Expired") {
      throw new BillingError("Selected batch is expired and cannot be billed");
    }

    if (batch.quantity < quantity) {
      throw new BillingError(`Insufficient stock for batch ${batch.batchNumber}`);
    }

    const mrp = roundCurrency(item.mrp ?? batch.mrp ?? medicine.mrp);
    const gstPercent = roundCurrency(item.gstPercent ?? item.gst ?? medicine.gst ?? 0);
    const line = calculateLine({ quantity, mrp, discount, gstPercent });

    invoiceItems.push({
      medicineId: medicine._id,
      medicineName: medicine.name,
      genericName: medicine.genericName || "",
      company: medicine.company || "",
      batchId: batch._id,
      batchNo: batch.batchNumber,
      expiry: batch.expiryDate,
      quantity,
      mrp,
      discount: line.discount,
      gstPercent,
      grossAmount: line.grossAmount,
      taxableAmount: line.taxableAmount,
      gstAmount: line.gstAmount,
      totalAmount: line.totalAmount,
    });

    stockAdjustments.push({ medicine, batch, quantity });
  }

  return { invoiceItems, stockAdjustments };
};

export const createInvoice = async ({ tenantId, userId, payload }) => {
  const session = await mongoose.startSession();

  try {
    let response;

    await session.withTransaction(async () => {
      await validateBillingPayload({ tenantId, payload, session });

      const {
        billingType = "Walk-in",
        customerId,
        customerName,
        customerMobile,
        doctorName = "",
        prescriptionId = null,
        items,
        paidAmount = 0,
        paymentMode = "Cash",
        splitPayments = [],
        transactionRef = "",
        notes = "",
      } = payload;

      const customerSnapshot = await getCustomerSnapshot({
        tenantId,
        customerId,
        customerName,
        customerMobile,
        session,
      });

      const { invoiceItems, stockAdjustments } = await buildInvoiceItems({
        tenantId,
        items,
        session,
      });

      const invoiceNo = await buildInvoiceNumber({ tenantId, session });
      const totals = calculateBillTotals(invoiceItems);
      const safePaidAmount = roundCurrency(paidAmount);
      const dueAmount = roundCurrency(Math.max(totals.grandTotal - safePaidAmount, 0));
      const paymentStatus = getPaymentStatus(safePaidAmount, totals.grandTotal);

      if (dueAmount > 0 && !customerSnapshot.hasExplicitCustomerDetails) {
        throw new BillingError("Customer details are required for due billing.");
      }

      const [invoice] = await Invoice.create(
        [
          {
            tenantId,
            invoiceNo,
            billingType,
            customerId: customerSnapshot.customerId,
            customerName: customerSnapshot.customerName,
            customerMobile: customerSnapshot.customerMobile,
            doctorName: doctorName.trim(),
            prescriptionId,
            items: invoiceItems,
            ...totals,
            paidAmount: safePaidAmount,
            dueAmount,
            paymentMode,
            paymentStatus,
            notes,
            createdBy: userId,
          },
        ],
        { session }
      );

      for (const adjustment of stockAdjustments) {
        adjustment.batch.quantity -= adjustment.quantity;
        await adjustment.batch.save({ session });

        await StockMovement.create(
          [
            {
              tenantId,
              medicineId: adjustment.medicine._id,
              batchId: adjustment.batch._id,
              type: "OUT",
              quantity: adjustment.quantity,
              reason: "Billing sale",
              referenceType: "Invoice",
              referenceId: invoice._id,
              createdBy: userId,
            },
          ],
          { session }
        );
      }

      await Sale.insertMany(
        invoiceItems.map((item) => ({
          tenantId,
          invoiceId: invoice._id,
          invoiceNo,
          customerId: customerSnapshot.customerId,
          customerName: customerSnapshot.customerName,
          medicineId: item.medicineId,
          medicineName: item.medicineName,
          genericName: item.genericName,
          company: item.company,
          batchId: item.batchId,
          batchNo: item.batchNo,
          expiry: item.expiry,
          quantity: item.quantity,
          mrp: item.mrp,
          discount: item.discount,
          gstPercent: item.gstPercent,
          gstAmount: item.gstAmount,
          total: item.totalAmount,
          soldAt: invoice.createdAt || new Date(),
        })),
        { session }
      );

      await Payment.create(
        [
          {
            tenantId,
            invoiceId: invoice._id,
            invoiceNo,
            paymentMode,
            paidAmount: safePaidAmount,
            dueAmount,
            paymentStatus,
            transactionRef,
            splitPayments: paymentMode === "Split Payment" ? normalizeSplitPayments(splitPayments) : [],
            createdBy: userId,
          },
        ],
        { session }
      );

      let dueRecord = null;
      if (dueAmount > 0) {
        [dueRecord] = await Due.create(
          [
            {
              tenantId,
              invoiceId: invoice._id,
              invoiceNo,
              customerId: customerSnapshot.customerId,
              customerName: customerSnapshot.customerName,
              customerMobile: customerSnapshot.customerMobile,
              grandTotal: totals.grandTotal,
              paidAmount: safePaidAmount,
              dueAmount,
              status: "Open",
            },
          ],
          { session }
        );

        if (customerSnapshot.customerId) {
          await Customer.updateOne(
            { _id: customerSnapshot.customerId, tenantId },
            { $inc: { dueAmount } },
            { session }
          );
        }
      }

      response = {
        success: true,
        message: "Bill created successfully",
        invoiceNo,
        invoice,
        due: dueRecord,
      };
    });

    return response;
  } finally {
    await session.endSession();
  }
};

export const listInvoices = async ({ tenantId }) =>
  Invoice.find({ tenantId }).sort({ createdAt: -1 });

export const getInvoiceById = async ({ tenantId, id }) => {
  const invoice = await Invoice.findOne({ _id: id, tenantId });
  if (!invoice) throw new BillingError("Invoice not found.", 404);
  return invoice;
};

export const getInvoiceByNumber = async ({ tenantId, invoiceNo }) => {
  const invoice = await Invoice.findOne({ invoiceNo, tenantId });
  if (!invoice) throw new BillingError("Invoice not found.", 404);
  return invoice;
};

export const listOpenDues = async ({ tenantId }) =>
  Due.find({ tenantId, dueAmount: { $gt: 0 } }).sort({ createdAt: -1 });

export const collectDuePayment = async ({ tenantId, userId, dueId, payload }) => {
  const session = await mongoose.startSession();

  try {
    let result;

    await session.withTransaction(async () => {
      const due = await Due.findOne({ _id: dueId, tenantId }).session(session);
      if (!due) throw new BillingError("Due record not found.", 404);

      const amount = roundCurrency(payload.amount);
      if (!Number.isFinite(amount) || amount <= 0) {
        throw new BillingError("Payment amount must be greater than zero.");
      }

      if (amount > due.dueAmount) {
        throw new BillingError("Payment amount cannot exceed due amount.");
      }

      const paymentMode = payload.paymentMode || "Cash";
      if (!PAYMENT_MODES.includes(paymentMode)) {
        throw new BillingError("Invalid payment mode selected.");
      }

      const invoice = await Invoice.findOne({ _id: due.invoiceId, tenantId }).session(session);
      if (!invoice) throw new BillingError("Invoice not found.", 404);

      due.paidAmount = roundCurrency(due.paidAmount + amount);
      due.dueAmount = roundCurrency(due.dueAmount - amount);
      due.status = due.dueAmount <= 0 ? "Closed" : "Open";
      due.collections.push({
        amount,
        paymentMode,
        transactionRef: payload.transactionRef || "",
      });
      if (due.status === "Closed") {
        due.closedAt = new Date();
      }
      await due.save({ session });

      invoice.paidAmount = roundCurrency(invoice.paidAmount + amount);
      invoice.dueAmount = roundCurrency(Math.max(invoice.grandTotal - invoice.paidAmount, 0));
      invoice.paymentStatus = getPaymentStatus(invoice.paidAmount, invoice.grandTotal);
      if (invoice.paymentMode !== paymentMode) {
        invoice.paymentMode = "Split Payment";
      }
      await invoice.save({ session });

      const [payment] = await Payment.create(
        [
          {
            tenantId,
            invoiceId: invoice._id,
            dueId: due._id,
            invoiceNo: invoice.invoiceNo,
            paymentMode,
            paidAmount: amount,
            dueAmount: due.dueAmount,
            paymentStatus: invoice.paymentStatus,
            transactionRef: payload.transactionRef || "",
            splitPayments:
              paymentMode === "Split Payment" ? normalizeSplitPayments(payload.splitPayments) : [],
            paymentStage: "DueCollection",
            createdBy: userId,
          },
        ],
        { session }
      );

      if (due.customerId) {
        await Customer.updateOne(
          { _id: due.customerId, tenantId },
          { $inc: { dueAmount: -amount } },
          { session }
        );
      }

      result = {
        success: true,
        message: "Due payment recorded successfully",
        due,
        invoice,
        payment,
      };
    });

    return result;
  } finally {
    await session.endSession();
  }
};

export const createReturn = async ({ tenantId, userId, payload }) => {
  const session = await mongoose.startSession();

  try {
    let result;

    await session.withTransaction(async () => {
      const { invoiceId, invoiceNo, medicineId, quantity, reason } = payload;

      if (!reason?.trim()) {
        throw new BillingError("Return reason is required.");
      }

      const invoice = await Invoice.findOne(
        invoiceId ? { _id: invoiceId, tenantId } : { invoiceNo, tenantId }
      ).session(session);

      if (!invoice) {
        throw new BillingError("Invoice not found.", 404);
      }

      const itemIndex = invoice.items.findIndex(
        (item) => String(item.medicineId) === String(medicineId)
      );

      if (itemIndex === -1) {
        throw new BillingError("Medicine was not sold on this invoice.");
      }

      const invoiceItem = invoice.items[itemIndex];
      const returnQty = Number(quantity);
      const maxReturnable = invoiceItem.quantity - (invoiceItem.returnedQuantity || 0);

      if (!Number.isFinite(returnQty) || returnQty <= 0) {
        throw new BillingError("Return quantity must be greater than zero.");
      }

      if (returnQty > maxReturnable) {
        throw new BillingError("Return quantity exceeds sold quantity.");
      }

      const batch = await MedicineBatch.findOne({
        _id: invoiceItem.batchId,
        medicineId: invoiceItem.medicineId,
        tenantId,
      }).session(session);

      if (!batch) {
        throw new BillingError("Original batch not found.", 404);
      }

      const refundAmount = roundCurrency((invoiceItem.totalAmount / invoiceItem.quantity) * returnQty);

      batch.quantity += returnQty;
      await batch.save({ session });

      invoiceItem.returnedQuantity = (invoiceItem.returnedQuantity || 0) + returnQty;
      invoiceItem.returnedAmount = roundCurrency((invoiceItem.returnedAmount || 0) + refundAmount);
      invoice.refundedAmount = roundCurrency((invoice.refundedAmount || 0) + refundAmount);

      const allReturned = invoice.items.every(
        (item) => (item.returnedQuantity || 0) >= item.quantity
      );
      const anyReturned = invoice.items.some((item) => (item.returnedQuantity || 0) > 0);
      invoice.returnStatus = allReturned ? "Returned" : anyReturned ? "Partial" : "None";
      await invoice.save({ session });

      await Sale.updateMany(
        {
          tenantId,
          invoiceId: invoice._id,
          medicineId: invoiceItem.medicineId,
          batchId: invoiceItem.batchId,
        },
        { $inc: { returnedQuantity: returnQty } },
        { session }
      );

      const [salesReturn] = await SalesReturn.create(
        [
          {
            tenantId,
            invoiceId: invoice._id,
            invoiceNo: invoice.invoiceNo,
            medicineId: invoiceItem.medicineId,
            medicineName: invoiceItem.medicineName,
            batchId: invoiceItem.batchId,
            batchNo: invoiceItem.batchNo,
            quantity: returnQty,
            refundAmount,
            reason: reason.trim(),
            processedBy: userId,
          },
        ],
        { session }
      );

      await StockMovement.create(
        [
          {
            tenantId,
            medicineId: invoiceItem.medicineId,
            batchId: invoiceItem.batchId,
            type: "RETURN",
            quantity: returnQty,
            reason: `Sales return for ${invoice.invoiceNo}`,
            referenceType: "SalesReturn",
            referenceId: salesReturn._id,
            createdBy: userId,
          },
        ],
        { session }
      );

      result = {
        success: true,
        message: "Sales return processed successfully",
        refundAmount,
        return: salesReturn,
        invoice,
      };
    });

    return result;
  } finally {
    await session.endSession();
  }
};

export const getInvoicePdfData = async ({ tenantId, id }) => {
  const [invoice, tenant] = await Promise.all([
    getInvoiceById({ tenantId, id }),
    Tenant.findById(tenantId),
  ]);

  return { invoice, tenant };
};

export { BillingError, calculateBillTotals, calculateLine, getBatchStatus, getPaymentStatus };
