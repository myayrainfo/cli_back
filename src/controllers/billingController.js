import Customer from "../models/Customer.js";
import Medicine from "../models/Medicine.js";
import MedicineBatch from "../models/MedicineBatch.js";
import ReturnModel from "../models/Return.js";
import Sale from "../models/Sale.js";
import StockMovement from "../models/StockMovement.js";

const calculateBillingTotals = (items) => {
  return items.reduce(
    (acc, item) => {
      const lineBase = item.quantity * item.mrp;
      const discountValue = item.discount || 0;
      const taxable = lineBase - discountValue;
      const gstValue = taxable * ((item.gst || 0) / 100);
      const total = taxable + gstValue;

      acc.subtotal += lineBase;
      acc.discountTotal += discountValue;
      acc.gstTotal += gstValue;
      acc.grandTotal += total;

      return acc;
    },
    { subtotal: 0, discountTotal: 0, gstTotal: 0, grandTotal: 0 }
  );
};

const buildInvoiceNumber = () => `INV-${Date.now()}`;

export const getSales = async (req, res) => {
  const sales = await Sale.find({ tenantId: req.user.tenantId }).sort({ createdAt: -1 });
  res.json(sales);
};

export const createSale = async (req, res) => {
  const { tenantId, userId } = req.user;
  const {
    customerId,
    customerName = "Walk-in Customer",
    items = [],
    paymentMethod = "Cash",
    paymentStatus = "Paid",
    amountPaid = 0,
    notes = "",
  } = req.body;

  if (!items.length) {
    return res.status(400).json({ message: "Sale items are required." });
  }

  const saleItems = [];

  for (const item of items) {
    const batch = await MedicineBatch.findOne({
      _id: item.batchId,
      tenantId,
    });
    if (!batch) {
      return res.status(404).json({ message: `Batch not found for item ${item.medicineId}.` });
    }

    if (new Date(batch.expiryDate) < new Date()) {
      return res.status(400).json({ message: `Expired batch blocked: ${batch.batchNumber}` });
    }

    if (batch.quantity < item.quantity) {
      return res.status(400).json({ message: `Insufficient stock for batch ${batch.batchNumber}` });
    }

    const medicine = await Medicine.findOne({ _id: item.medicineId, tenantId });
    if (!medicine) {
      return res.status(404).json({ message: "Medicine not found." });
    }

    batch.quantity -= item.quantity;
    await batch.save();

    const lineBase = item.quantity * (item.mrp ?? medicine.mrp);
    const discount = item.discount ?? 0;
    const taxable = lineBase - discount;
    const gst = item.gst ?? medicine.gst ?? 0;
    const total = taxable + taxable * (gst / 100);

    saleItems.push({
      medicineId: medicine._id,
      batchId: batch._id,
      medicineName: medicine.name,
      batchNumber: batch.batchNumber,
      expiryDate: batch.expiryDate,
      quantity: item.quantity,
      mrp: item.mrp ?? medicine.mrp,
      discount,
      gst,
      total,
    });

    await StockMovement.create({
      tenantId,
      medicineId: medicine._id,
      batchId: batch._id,
      type: "OUT",
      quantity: item.quantity,
      reason: "Billing sale",
      createdBy: userId,
    });
  }

  const totals = calculateBillingTotals(saleItems);
  const amountDue = Math.max(totals.grandTotal - amountPaid, 0);

  const sale = await Sale.create({
    tenantId,
    invoiceNumber: buildInvoiceNumber(),
    customerId: customerId || null,
    customerName,
    items: saleItems,
    ...totals,
    paymentMethod,
    paymentStatus,
    amountPaid,
    amountDue,
    notes,
  });

  if (customerId) {
    await Customer.findOneAndUpdate(
      { _id: customerId, tenantId },
      { $set: { dueAmount: amountDue } }
    );
  }

  res.status(201).json(sale);
};

export const updateSale = async (req, res) => {
  const sale = await Sale.findOneAndUpdate(
    { _id: req.params.id, tenantId: req.user.tenantId },
    req.body,
    { new: true }
  );

  if (!sale) {
    return res.status(404).json({ message: "Sale not found." });
  }

  res.json(sale);
};

export const deleteSale = async (req, res) => {
  const sale = await Sale.findOneAndDelete({ _id: req.params.id, tenantId: req.user.tenantId });
  if (!sale) {
    return res.status(404).json({ message: "Sale not found." });
  }

  await ReturnModel.create({
    tenantId: req.user.tenantId,
    type: "SALE_RETURN",
    referenceId: sale._id,
    amount: sale.grandTotal,
    reason: "Sale deletion placeholder for return flow",
  });

  res.json({ message: "Sale deleted." });
};
