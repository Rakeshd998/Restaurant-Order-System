import { Request, Response, NextFunction } from "express";
import AppError from "../utils/appError";

//* Database Errors ************************************************

// Cast Error
const handleCastErrorDB = (error: any): AppError => {
  const message = `Invalid ${error.path}: ${error.value}!`;
  return new AppError(message, 400);
};

// Duplicate fields Error
const handleDuplicateFieldsDB = (error: any): AppError => {
  const key = Object.keys(error.keyValue)[0];
  const value = Object.values(error.keyValue)[0];
  const message = `${value} already in use. Please use another ${key}!`;

  return new AppError(message, 400);
};

// Validation Error
const handleValidationErrorDB = (error: any): AppError => {
  const errors = Object.values(error.errors).map((el: any) => el.message);
  const message = errors.join(". ");
  return new AppError(message, 400);
};

//* Development Error **********************************************

const sendErrorDev = (err: any, res: Response): void => {
  console.error(err);
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    error: err,
    stack: err.stack,
  });
};

//* Production Error ***********************************************

const sendErrorProd = (err: any, res: Response): void => {
  if (err.isOperational) {
    // Operational Errors
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    // Programming or other unknown errors
    console.error("Error:", err); // Logging error in hosting platform console

    res.status(500).json({
      status: "ERROR",
      message: "Something went very wrong!",
    });
  }
};

//* Middlewares ****************************************************
//* Global Error Handler *******************************************

const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (res.headersSent) {
    return next(err);
  }

  err.statusCode = err.statusCode || 500;
  err.status = err.status || "ERROR";

  if (process.env.NODE_ENV === "development") {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === "production") {
    let error = { ...err, message: err.message };

    if (err.name === "CastError") error = handleCastErrorDB(error);
    if (err.code === 11000) error = handleDuplicateFieldsDB(error);
    if (err.name === "ValidationError") error = handleValidationErrorDB(error);

    sendErrorProd(error, res);
  }
};

export default globalErrorHandler;
