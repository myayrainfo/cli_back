import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Tenant from "../models/Tenant.js";
import User from "../models/User.js";

const signToken = (user) =>
  jwt.sign(
    {
      userId: user._id,
      tenantId: user.tenantId,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

export const login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(401).json({ message: "Invalid credentials." });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ message: "Invalid credentials." });
  }

  const tenant = await Tenant.findById(user.tenantId);
  const token = signToken(user);

  return res.json({
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      tenantName: tenant?.storeName || "",
    },
  });
};

export const me = async (req, res) => {
  const tenant = await Tenant.findById(req.user.tenantId);
  res.json({
    user: {
      id: req.user.userId,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      tenantId: req.user.tenantId,
      tenantName: tenant?.storeName || "",
    },
  });
};
