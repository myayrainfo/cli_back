import {
  BillingError,
  collectDuePayment,
  createInvoice,
  createReturn,
  getInvoiceById,
  getInvoiceByNumber,
  getInvoicePdfData,
  listInvoices,
  listOpenDues,
} from "../services/billingService.js";

const serializeInvoice = (invoice) => {
  const payload = typeof invoice?.toObject === "function" ? invoice.toObject() : invoice;
  if (!payload) return payload;

  return {
    ...payload,
    invoiceNumber: payload.invoiceNo,
    paymentMethod: payload.paymentMode,
    amountPaid: payload.paidAmount,
    amountDue: payload.dueAmount,
    saleDate: payload.createdAt,
  };
};

const handleBillingError = (error, res) => {
  if (error instanceof BillingError || error.statusCode) {
    return res.status(error.statusCode || 400).json({
      success: false,
      message: error.message,
    });
  }

  console.error(error);
  return res.status(500).json({
    success: false,
    message: error.message || "Billing operation failed.",
  });
};

export const getInvoices = async (req, res) => {
  try {
    const invoices = await listInvoices({ tenantId: req.user.tenantId });
    res.json(invoices.map(serializeInvoice));
  } catch (error) {
    handleBillingError(error, res);
  }
};

export const getSales = getInvoices;

export const createBillingInvoice = async (req, res) => {
  try {
    const result = await createInvoice({
      tenantId: req.user.tenantId,
      userId: req.user.userId,
      payload: req.body,
    });

    res.status(201).json({
      ...result,
      invoice: serializeInvoice(result.invoice),
    });
  } catch (error) {
    handleBillingError(error, res);
  }
};

export const createSale = createBillingInvoice;

export const getInvoice = async (req, res) => {
  try {
    const invoice = await getInvoiceById({
      tenantId: req.user.tenantId,
      id: req.params.id,
    });

    res.json(serializeInvoice(invoice));
  } catch (error) {
    handleBillingError(error, res);
  }
};

export const getInvoiceByInvoiceNumber = async (req, res) => {
  try {
    const invoice = await getInvoiceByNumber({
      tenantId: req.user.tenantId,
      invoiceNo: req.params.invoiceNo,
    });

    res.json(serializeInvoice(invoice));
  } catch (error) {
    handleBillingError(error, res);
  }
};

export const getDues = async (req, res) => {
  try {
    const dues = await listOpenDues({ tenantId: req.user.tenantId });
    res.json(dues);
  } catch (error) {
    handleBillingError(error, res);
  }
};

export const payDue = async (req, res) => {
  try {
    const result = await collectDuePayment({
      tenantId: req.user.tenantId,
      userId: req.user.userId,
      dueId: req.params.id,
      payload: req.body,
    });

    res.json({
      ...result,
      invoice: serializeInvoice(result.invoice),
    });
  } catch (error) {
    handleBillingError(error, res);
  }
};

export const processSalesReturn = async (req, res) => {
  try {
    const result = await createReturn({
      tenantId: req.user.tenantId,
      userId: req.user.userId,
      payload: req.body,
    });

    res.status(201).json({
      ...result,
      invoice: serializeInvoice(result.invoice),
    });
  } catch (error) {
    handleBillingError(error, res);
  }
};

export const getInvoicePdf = async (req, res) => {
  try {
    const { invoice, tenant } = await getInvoicePdfData({
      tenantId: req.user.tenantId,
      id: req.params.id,
    });

    const PDFDocumentModule = await import("pdfkit");
    const PDFDocument = PDFDocumentModule.default || PDFDocumentModule;
    const doc = new PDFDocument({ size: "A4", margin: 40 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=\"${invoice.invoiceNo}.pdf\"`);
    doc.pipe(res);

    const storeName = tenant?.storeName || "AYRA Clinic ERP";
    const storeAddress = tenant?.address || "Clinic address not configured";
    const storePhone = tenant?.phone || "Phone not configured";
    const storeGst = tenant?.gstNumber || "GST not configured";

    doc.fontSize(18).text(storeName, { align: "left" });
    doc.fontSize(9).fillColor("#5b6780").text(storeAddress);
    doc.text(`Phone: ${storePhone}`);
    doc.text(`GST: ${storeGst}`);
    doc.moveDown(0.8);

    doc.fillColor("#111827").fontSize(14).text("Pharmacy Invoice", { align: "right" });
    doc.fontSize(10).text(`Invoice No: ${invoice.invoiceNo}`, { align: "right" });
    doc.text(`Date: ${new Date(invoice.createdAt).toLocaleString("en-IN")}`, { align: "right" });
    doc.moveDown();

    doc.fontSize(10).text(`Customer: ${invoice.customerName || "Walk-in Customer"}`);
    doc.text(`Mobile: ${invoice.customerMobile || "-"}`);
    doc.text(`Doctor: ${invoice.doctorName || "-"}`);
    doc.text(`Prescription ID: ${invoice.prescriptionId || "-"}`);
    doc.moveDown();

    const startY = doc.y;
    const columns = [40, 170, 240, 305, 350, 400, 455, 515];
    doc.fontSize(9).text("Medicine", columns[0], startY);
    doc.text("Batch", columns[1], startY);
    doc.text("Expiry", columns[2], startY);
    doc.text("Qty", columns[3], startY);
    doc.text("MRP", columns[4], startY);
    doc.text("Disc", columns[5], startY);
    doc.text("GST", columns[6], startY);
    doc.text("Total", columns[7], startY, { width: 40, align: "right" });
    doc.moveTo(40, startY + 14).lineTo(555, startY + 14).strokeColor("#d8e1ef").stroke();

    let rowY = startY + 22;
    invoice.items.forEach((item) => {
      doc.fontSize(8).fillColor("#111827").text(item.medicineName, columns[0], rowY, { width: 120 });
      doc.text(item.batchNo, columns[1], rowY, { width: 60 });
      doc.text(new Date(item.expiry).toLocaleDateString("en-IN"), columns[2], rowY, { width: 55 });
      doc.text(String(item.quantity), columns[3], rowY, { width: 35 });
      doc.text(item.mrp.toFixed(2), columns[4], rowY, { width: 45, align: "right" });
      doc.text(item.discount.toFixed(2), columns[5], rowY, { width: 45, align: "right" });
      doc.text(`${item.gstPercent}%`, columns[6], rowY, { width: 35, align: "right" });
      doc.text(item.totalAmount.toFixed(2), columns[7], rowY, { width: 40, align: "right" });
      rowY += 20;
    });

    doc.moveTo(40, rowY).lineTo(555, rowY).strokeColor("#d8e1ef").stroke();
    rowY += 14;

    const summaryX = 370;
    doc.fontSize(9).fillColor("#111827").text(`Subtotal: INR ${invoice.subtotal.toFixed(2)}`, summaryX, rowY);
    rowY += 14;
    doc.text(`Discount: INR ${invoice.discountTotal.toFixed(2)}`, summaryX, rowY);
    rowY += 14;
    doc.text(`GST: INR ${invoice.gstTotal.toFixed(2)}`, summaryX, rowY);
    rowY += 14;
    doc.text(`Round Off: INR ${invoice.roundOff.toFixed(2)}`, summaryX, rowY);
    rowY += 14;
    doc.fontSize(10).text(`Grand Total: INR ${invoice.grandTotal.toFixed(2)}`, summaryX, rowY);
    rowY += 14;
    doc.text(`Paid: INR ${invoice.paidAmount.toFixed(2)}`, summaryX, rowY);
    rowY += 14;
    doc.text(`Due: INR ${invoice.dueAmount.toFixed(2)}`, summaryX, rowY);
    rowY += 14;
    doc.text(`Mode: ${invoice.paymentMode}`, summaryX, rowY);
    rowY += 14;
    doc.text(`Status: ${invoice.paymentStatus}`, summaryX, rowY);

    doc.moveDown(4);
    doc.fontSize(9).fillColor("#5b6780").text("Thank you for choosing AYRA Clinic ERP.", 40);
    doc.text("Return policy: Subject to medicine condition and billing terms.", 40);
    doc.text("Generated by AYRA Clinic ERP", 40);

    doc.end();
  } catch (error) {
    handleBillingError(error, res);
  }
};
