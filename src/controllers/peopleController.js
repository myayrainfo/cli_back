import Customer from "../models/Customer.js";
import Supplier from "../models/Supplier.js";

const scopedQuery = (req) => ({ tenantId: req.user.tenantId });

export const getCustomers = async (req, res) => {
  res.json(await Customer.find(scopedQuery(req)).sort({ createdAt: -1 }));
};

export const createCustomer = async (req, res) => {
  res.status(201).json(await Customer.create({ ...req.body, tenantId: req.user.tenantId }));
};

export const updateCustomer = async (req, res) => {
  const customer = await Customer.findOneAndUpdate(
    { _id: req.params.id, ...scopedQuery(req) },
    req.body,
    { new: true }
  );
  if (!customer) return res.status(404).json({ message: "Customer not found." });
  res.json(customer);
};

export const deleteCustomer = async (req, res) => {
  await Customer.findOneAndDelete({ _id: req.params.id, ...scopedQuery(req) });
  res.json({ message: "Customer deleted." });
};

export const getSuppliers = async (req, res) => {
  res.json(await Supplier.find(scopedQuery(req)).sort({ createdAt: -1 }));
};

export const createSupplier = async (req, res) => {
  res.status(201).json(await Supplier.create({ ...req.body, tenantId: req.user.tenantId }));
};

export const updateSupplier = async (req, res) => {
  const supplier = await Supplier.findOneAndUpdate(
    { _id: req.params.id, ...scopedQuery(req) },
    req.body,
    { new: true }
  );
  if (!supplier) return res.status(404).json({ message: "Supplier not found." });
  res.json(supplier);
};

export const deleteSupplier = async (req, res) => {
  await Supplier.findOneAndDelete({ _id: req.params.id, ...scopedQuery(req) });
  res.json({ message: "Supplier deleted." });
};
