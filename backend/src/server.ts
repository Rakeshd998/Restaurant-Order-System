import dotenv from "dotenv";
import mongoose from "mongoose";
import app from "./app";

//* Load environment variables **************************************
dotenv.config();

//* Handle Uncaught Exceptions **************************************
process.on("uncaughtException", (err: Error) => {
  console.error("Uncaught Exception! Shutting down...");
  console.error("Error:", err.message);
  process.exit(1);
});

//* DB Connection **************************************************
mongoose
  .connect(process.env.MONGO_URI as string)
  .then((conn) => console.log(`MongoDB connected: ${conn.connection.host}`))
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err.message);
    process.exit(1); // Exit if database connection fails
  });

//* Start server ***************************************************
const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`Server started listening at port ${port}`);
});

//* Handle Unhandled Promise Rejections ****************************
process.on("unhandledRejection", (err: any) => {
  console.error("Unhandled Rejection! Shutting down...");
  console.error("Error:", err.message || err);

  server.close(() => process.exit(1));
});
