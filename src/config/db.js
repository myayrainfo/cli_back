import mongoose from "mongoose";

export const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error("MONGO_URI is missing in environment variables.");
  }

  await mongoose.connect(mongoUri, {
    dbName: "arya_clinic",
  });

  console.log("MongoDB connected");
};
