// Purpose: Connect to MongoDB using mongoose
const mongoose = require("mongoose");
const connectString = process.env.connection_String;

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(connectString, {
      serverSelectionTimeoutMS: 60000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 12000,
    });
    return conn.connection;
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
