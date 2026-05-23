import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { connectDB } from "../config/db.js";
import Appointment from "../models/Appointment.js";
import AuditLog from "../models/AuditLog.js";
import ClinicPatient from "../models/ClinicPatient.js";
import Customer from "../models/Customer.js";
import Discount from "../models/Discount.js";
import Medicine from "../models/Medicine.js";
import MedicineBatch from "../models/MedicineBatch.js";
import Prescription from "../models/Prescription.js";
import Purchase from "../models/Purchase.js";
import Sale from "../models/Sale.js";
import StockMovement from "../models/StockMovement.js";
import Supplier from "../models/Supplier.js";
import Tenant from "../models/Tenant.js";
import User from "../models/User.js";

dotenv.config();

const daysFromNow = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
};

const runSeed = async () => {
  await connectDB();

  await Promise.all([
    Appointment.deleteMany({}),
    AuditLog.deleteMany({}),
    ClinicPatient.deleteMany({}),
    Customer.deleteMany({}),
    Discount.deleteMany({}),
    Medicine.deleteMany({}),
    MedicineBatch.deleteMany({}),
    Prescription.deleteMany({}),
    Purchase.deleteMany({}),
    Sale.deleteMany({}),
    StockMovement.deleteMany({}),
    Supplier.deleteMany({}),
    User.deleteMany({}),
    Tenant.deleteMany({}),
  ]);

  const tenant = await Tenant.create({
    storeName: "Arya Clinic Pharmacy",
    ownerName: "Demo Owner",
    email: "owner@arya-clinic.com",
    phone: "+91 9876543210",
    address: "123 Green Care Avenue",
    gstNumber: "29ABCDE1234F1Z5",
    planName: "Starter",
    paymentStatus: "Trial",
    settings: {
      gstPercentage: 12,
      invoiceTemplate: "Classic",
      defaultDiscount: 5,
      medicineCategories: ["Antibiotic", "Pain Relief", "Diabetes", "Cardiac"],
      racks: ["A1", "A2", "B1", "Cold-01"],
      backupEnabled: false,
      branches: [{ name: "Main Branch", address: "123 Green Care Avenue" }],
    },
  });

  const hashedPassword = await bcrypt.hash("Owner@123", 10);
  const user = await User.create({
    tenantId: tenant._id,
    name: "Demo Owner",
    email: "owner@arya-clinic.com",
    password: hashedPassword,
    role: "TENANT_OWNER",
  });

  const customers = await Customer.insertMany([
    {
      tenantId: tenant._id,
      name: "Ravi Kumar",
      phone: "9991112221",
      address: "Kolkata",
      dueAmount: 250,
      loyaltyPoints: 40,
      regularCustomerDiscount: 5,
      chronicTracking: true,
    },
    {
      tenantId: tenant._id,
      name: "Sneha Das",
      phone: "9991112222",
      address: "Howrah",
      dueAmount: 0,
      loyaltyPoints: 20,
      regularCustomerDiscount: 3,
      chronicTracking: false,
    },
    {
      tenantId: tenant._id,
      name: "Aman Roy",
      phone: "9991112223",
      address: "Salt Lake",
      dueAmount: 500,
      loyaltyPoints: 55,
      regularCustomerDiscount: 7,
      chronicTracking: true,
    },
  ]);

  const suppliers = await Supplier.insertMany([
    {
      tenantId: tenant._id,
      name: "Medico Pharma Distributors",
      phone: "8881111001",
      email: "sales@medico.com",
      address: "Bengaluru",
      paymentDue: 3200,
      gstNumber: "29SUPP0001F1Z5",
      contactPerson: "Karan Shah",
      companiesSupplied: ["Sun Pharma", "Cipla"],
    },
    {
      tenantId: tenant._id,
      name: "LifeCare Supplies",
      phone: "8881111002",
      email: "support@lifecare.com",
      address: "Mumbai",
      paymentDue: 0,
      gstNumber: "27SUPP0002F1Z5",
      contactPerson: "Neha Jain",
      companiesSupplied: ["Dr. Reddy's", "Mankind"],
    },
    {
      tenantId: tenant._id,
      name: "HealthNova Traders",
      phone: "8881111003",
      email: "orders@healthnova.com",
      address: "Delhi",
      paymentDue: 1800,
      gstNumber: "07SUPP0003F1Z5",
      contactPerson: "Arpit Sharma",
      companiesSupplied: ["Abbott", "Pfizer"],
    },
  ]);

  const medicines = await Medicine.insertMany([
    {
      tenantId: tenant._id,
      name: "Paracet 650",
      category: "Pain Relief",
      company: "Sun Pharma",
      genericName: "Paracetamol",
      composition: "Paracetamol 650mg",
      mrp: 35,
      purchasePrice: 22,
      sellingPrice: 32,
      gst: 5,
      discountRule: "5% on bulk",
      rackLocation: "A1",
      barcodeValue: "890123450001",
      imageUrl: "https://placehold.co/120x120",
      minimumStock: 20,
      substituteSuggestions: ["Calpol 650", "Dolo 650"],
    },
    {
      tenantId: tenant._id,
      name: "Azicure 500",
      category: "Antibiotic",
      company: "Cipla",
      genericName: "Azithromycin",
      composition: "Azithromycin 500mg",
      mrp: 120,
      purchasePrice: 80,
      sellingPrice: 110,
      gst: 12,
      discountRule: "No discount",
      rackLocation: "A2",
      barcodeValue: "890123450002",
      imageUrl: "https://placehold.co/120x120",
      minimumStock: 10,
      substituteSuggestions: ["Azee 500"],
    },
    {
      tenantId: tenant._id,
      name: "GlucoSafe",
      category: "Diabetes",
      company: "Dr. Reddy's",
      genericName: "Metformin",
      composition: "Metformin 500mg",
      mrp: 90,
      purchasePrice: 55,
      sellingPrice: 82,
      gst: 5,
      discountRule: "4% diabetic care",
      rackLocation: "B1",
      barcodeValue: "890123450003",
      imageUrl: "https://placehold.co/120x120",
      minimumStock: 12,
      substituteSuggestions: ["Glycomet"],
    },
    {
      tenantId: tenant._id,
      name: "CardioPlus",
      category: "Cardiac",
      company: "Abbott",
      genericName: "Atorvastatin",
      composition: "Atorvastatin 10mg",
      mrp: 150,
      purchasePrice: 100,
      sellingPrice: 140,
      gst: 12,
      discountRule: "2% loyalty",
      rackLocation: "B1",
      barcodeValue: "890123450004",
      imageUrl: "https://placehold.co/120x120",
      minimumStock: 8,
      substituteSuggestions: ["Storvas"],
    },
    {
      tenantId: tenant._id,
      name: "ColdFree Syrup",
      category: "Cold and Cough",
      company: "Mankind",
      genericName: "Cetirizine",
      composition: "Cetirizine + Ambroxol",
      mrp: 95,
      purchasePrice: 60,
      sellingPrice: 88,
      gst: 12,
      discountRule: "Clearance eligible",
      rackLocation: "Cold-01",
      barcodeValue: "890123450005",
      imageUrl: "https://placehold.co/120x120",
      minimumStock: 15,
      substituteSuggestions: ["Alex Syrup"],
    },
    {
      tenantId: tenant._id,
      name: "Vitamin Max",
      category: "Supplements",
      company: "Pfizer",
      genericName: "Multivitamin",
      composition: "Vitamins + Zinc",
      mrp: 180,
      purchasePrice: 130,
      sellingPrice: 165,
      gst: 12,
      discountRule: "10% on combo",
      rackLocation: "A2",
      barcodeValue: "890123450006",
      imageUrl: "https://placehold.co/120x120",
      minimumStock: 10,
      substituteSuggestions: ["Becosules"],
    },
    {
      tenantId: tenant._id,
      name: "Gastro Calm",
      category: "Digestive Care",
      company: "Sun Pharma",
      genericName: "Pantoprazole",
      composition: "Pantoprazole 40mg",
      mrp: 110,
      purchasePrice: 75,
      sellingPrice: 99,
      gst: 5,
      discountRule: "No discount",
      rackLocation: "A1",
      barcodeValue: "890123450007",
      imageUrl: "https://placehold.co/120x120",
      minimumStock: 18,
      substituteSuggestions: ["Pantocid"],
    },
    {
      tenantId: tenant._id,
      name: "Dermacare Cream",
      category: "Skin Care",
      company: "Cipla",
      genericName: "Clotrimazole",
      composition: "Clotrimazole 1%",
      mrp: 75,
      purchasePrice: 45,
      sellingPrice: 69,
      gst: 12,
      discountRule: "Seasonal",
      rackLocation: "B1",
      barcodeValue: "890123450008",
      imageUrl: "https://placehold.co/120x120",
      minimumStock: 6,
      substituteSuggestions: ["Candid Cream"],
    },
  ]);

  const batchSpecs = [
    [medicines[0], "BATCH-PAR-001", -120, 45, 28],
    [medicines[0], "BATCH-PAR-002", -20, 180, 12],
    [medicines[1], "BATCH-AZI-001", -40, 60, 5],
    [medicines[2], "BATCH-GLU-001", -50, 120, 30],
    [medicines[3], "BATCH-CAR-001", -100, 20, 4],
    [medicines[4], "BATCH-COLD-001", -90, -5, 7],
    [medicines[5], "BATCH-VIT-001", -45, 150, 22],
    [medicines[6], "BATCH-GAS-001", -70, 88, 16],
    [medicines[7], "BATCH-DER-001", -60, 15, 3],
  ];

  const batches = [];
  for (const [medicine, batchNumber, mfgOffset, expiryOffset, quantity] of batchSpecs) {
    const batch = await MedicineBatch.create({
      tenantId: tenant._id,
      medicineId: medicine._id,
      batchNumber,
      manufacturingDate: daysFromNow(mfgOffset),
      expiryDate: daysFromNow(expiryOffset),
      quantity,
    });
    batches.push(batch);
  }

  await Discount.insertMany([
    { tenantId: tenant._id, title: "Loyalty Saver", type: "PERCENTAGE", value: 5, appliesTo: "CUSTOMER" },
    { tenantId: tenant._id, title: "Near Expiry Clearance", type: "PERCENTAGE", value: 10, appliesTo: "MEDICINE" },
  ]);

  const patients = await ClinicPatient.insertMany([
    {
      tenantId: tenant._id,
      name: "Priya Sen",
      phone: "7771112221",
      age: 32,
      gender: "Female",
      address: "Lake Town",
      medicalHistory: "Seasonal allergy",
    },
    {
      tenantId: tenant._id,
      name: "Rajdeep Ghosh",
      phone: "7771112222",
      age: 54,
      gender: "Male",
      address: "Barasat",
      medicalHistory: "Type 2 diabetes",
    },
  ]);

  await Appointment.insertMany([
    {
      tenantId: tenant._id,
      patientId: patients[0]._id,
      doctorName: "Dr. Ananya Paul",
      appointmentDate: daysFromNow(1),
      status: "Scheduled",
      notes: "Follow-up for allergy symptoms",
      followUpReminder: "WhatsApp placeholder",
    },
    {
      tenantId: tenant._id,
      patientId: patients[1]._id,
      doctorName: "Dr. Rohit Nair",
      appointmentDate: daysFromNow(2),
      status: "Scheduled",
      notes: "Medication review",
      followUpReminder: "SMS placeholder",
    },
  ]);

  await Prescription.insertMany([
    {
      tenantId: tenant._id,
      patientId: patients[0]._id,
      doctorName: "Dr. Ananya Paul",
      diagnosis: "Seasonal allergy",
      medicines: [{ name: "ColdFree Syrup", dosage: "5ml", duration: "5 days" }],
      labTests: [
        {
          type: "CBC",
          status: "Pending",
          result: "",
        },
      ],
    },
    {
      tenantId: tenant._id,
      patientId: patients[1]._id,
      doctorName: "Dr. Rohit Nair",
      diagnosis: "Diabetes review",
      medicines: [{ name: "GlucoSafe", dosage: "1 tab", duration: "30 days" }],
      labTests: [
        {
          type: "HbA1c",
          status: "Pending",
          result: "",
        },
      ],
    },
  ]);

  const purchaseDefinitions = [
    {
      supplier: suppliers[0],
      items: [
        { medicine: medicines[0], batch: batches[1], quantity: 20, purchasePrice: 22, mrp: 35, sellingPrice: 32, gst: 5 },
      ],
      amountPaid: 440,
      paymentStatus: "Paid",
    },
    {
      supplier: suppliers[1],
      items: [
        { medicine: medicines[2], batch: batches[3], quantity: 25, purchasePrice: 55, mrp: 90, sellingPrice: 82, gst: 5 },
      ],
      amountPaid: 1000,
      paymentStatus: "Partial",
    },
    {
      supplier: suppliers[2],
      items: [
        { medicine: medicines[5], batch: batches[6], quantity: 18, purchasePrice: 130, mrp: 180, sellingPrice: 165, gst: 12 },
      ],
      amountPaid: 0,
      paymentStatus: "Due",
    },
    {
      supplier: suppliers[0],
      items: [
        { medicine: medicines[6], batch: batches[7], quantity: 15, purchasePrice: 75, mrp: 110, sellingPrice: 99, gst: 5 },
      ],
      amountPaid: 800,
      paymentStatus: "Partial",
    },
  ];

  for (let i = 0; i < purchaseDefinitions.length; i += 1) {
    const def = purchaseDefinitions[i];
    const subtotal = def.items.reduce((sum, item) => sum + item.quantity * item.purchasePrice, 0);
    const gstTotal = def.items.reduce(
      (sum, item) => sum + item.quantity * item.purchasePrice * (item.gst / 100),
      0
    );
    const grandTotal = subtotal + gstTotal;

    await Purchase.create({
      tenantId: tenant._id,
      purchaseNumber: `PO-SEED-${i + 1}`,
      supplierId: def.supplier._id,
      supplierName: def.supplier.name,
      items: def.items.map((item) => ({
        medicineId: item.medicine._id,
        batchId: item.batch._id,
        medicineName: item.medicine.name,
        batchNumber: item.batch.batchNumber,
        manufacturingDate: item.batch.manufacturingDate,
        expiryDate: item.batch.expiryDate,
        quantity: item.quantity,
        purchasePrice: item.purchasePrice,
        mrp: item.mrp,
        sellingPrice: item.sellingPrice,
        gst: item.gst,
        lineTotal: item.quantity * item.purchasePrice * (1 + item.gst / 100),
      })),
      subtotal,
      gstTotal,
      grandTotal,
      amountPaid: def.amountPaid,
      amountDue: Math.max(grandTotal - def.amountPaid, 0),
      paymentStatus: def.paymentStatus,
      purchaseDate: daysFromNow(-(i + 1)),
    });
  }

  const saleDefinitions = [
    {
      customer: customers[0],
      items: [{ medicine: medicines[0], batch: batches[0], quantity: 2, mrp: 35, discount: 5, gst: 5 }],
      amountPaid: 68.25,
      paymentStatus: "Paid",
    },
    {
      customer: customers[1],
      items: [{ medicine: medicines[2], batch: batches[3], quantity: 1, mrp: 90, discount: 0, gst: 5 }],
      amountPaid: 50,
      paymentStatus: "Partial",
    },
    {
      customer: customers[2],
      items: [{ medicine: medicines[5], batch: batches[6], quantity: 1, mrp: 180, discount: 10, gst: 12 }],
      amountPaid: 0,
      paymentStatus: "Due",
    },
    {
      customer: customers[0],
      items: [{ medicine: medicines[6], batch: batches[7], quantity: 3, mrp: 110, discount: 0, gst: 5 }],
      amountPaid: 346.5,
      paymentStatus: "Paid",
    },
    {
      customer: null,
      customerName: "Walk-in Customer",
      items: [{ medicine: medicines[3], batch: batches[4], quantity: 1, mrp: 150, discount: 5, gst: 12 }],
      amountPaid: 162.4,
      paymentStatus: "Paid",
    },
  ];

  for (let i = 0; i < saleDefinitions.length; i += 1) {
    const def = saleDefinitions[i];
    const items = def.items.map((item) => {
      const lineBase = item.quantity * item.mrp;
      const taxable = lineBase - item.discount;
      const total = taxable + taxable * (item.gst / 100);
      return {
        medicineId: item.medicine._id,
        batchId: item.batch._id,
        medicineName: item.medicine.name,
        batchNumber: item.batch.batchNumber,
        expiryDate: item.batch.expiryDate,
        quantity: item.quantity,
        mrp: item.mrp,
        discount: item.discount,
        gst: item.gst,
        total,
      };
    });

    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.mrp, 0);
    const discountTotal = items.reduce((sum, item) => sum + item.discount, 0);
    const gstTotal = items.reduce(
      (sum, item) => sum + (item.quantity * item.mrp - item.discount) * (item.gst / 100),
      0
    );
    const grandTotal = items.reduce((sum, item) => sum + item.total, 0);

    await Sale.create({
      tenantId: tenant._id,
      invoiceNumber: `INV-SEED-${i + 1}`,
      customerId: def.customer?._id || null,
      customerName: def.customer?.name || def.customerName,
      items,
      subtotal,
      discountTotal,
      gstTotal,
      grandTotal,
      paymentMethod: i % 2 === 0 ? "UPI" : "Cash",
      paymentStatus: def.paymentStatus,
      amountPaid: def.amountPaid,
      amountDue: Math.max(grandTotal - def.amountPaid, 0),
      saleDate: daysFromNow(-i),
      notes: "Seeded sale",
    });
  }

  await StockMovement.insertMany(
    batches.map((batch, index) => ({
      tenantId: tenant._id,
      medicineId: batch.medicineId,
      batchId: batch._id,
      type: index % 3 === 0 ? "OUT" : "IN",
      quantity: index % 3 === 0 ? 2 : 5,
      reason: index % 3 === 0 ? "Seed sale movement" : "Seed purchase movement",
      createdBy: user._id,
    }))
  );

  await AuditLog.insertMany([
    {
      tenantId: tenant._id,
      action: "LOGIN",
      module: "AUTH",
      message: "Seed owner login prepared",
      userId: user._id,
    },
    {
      tenantId: tenant._id,
      action: "CREATE",
      module: "MEDICINES",
      message: "Seeded medicines and batches",
      userId: user._id,
    },
    {
      tenantId: tenant._id,
      action: "CREATE",
      module: "SALES",
      message: "Seeded sales data",
      userId: user._id,
    },
    {
      tenantId: tenant._id,
      action: "CREATE",
      module: "PURCHASES",
      message: "Seeded purchases data",
      userId: user._id,
    },
  ]);

  console.log("Seed completed successfully.");
  process.exit(0);
};

runSeed().catch((error) => {
  console.error("Seed failed", error);
  process.exit(1);
});
