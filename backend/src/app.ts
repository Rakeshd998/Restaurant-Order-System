import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import mongoSanitize from "express-mongo-sanitize";
import hpp from "hpp";
import compression from "compression";
import path from "path";
import http from "http";
import { Server } from "socket.io";

import AppError from "./utils/appError";
import errorHandler from "./middlewares/errorMiddleware";

// Import Routes

//* Start express app **********************************************

const app = express();
const server = http.createServer(app);

//* Middlewares ****************************************************

// Implement cors
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      process.env.FRONTEND_URL || "",
    ],
    credentials: true,
  })
);
app.options("*", cors());

// Set security HTTP headers
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));

// Logger for dev
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Limit requests
const limiter = rateLimit({
  max: 2000,
  windowMs: 15 * 60 * 1000,
  message: new AppError(
    "Too many requests from this IP, please try again in 15 minutes.",
    429
  ),
});
app.use("/api", limiter);

// Body parser
app.use(express.json({ limit: "20kb" }));

// Cookie parser
app.use(cookieParser());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Prevent parameter pollution
app.use(hpp());

// Compression
app.use(compression());

//* Routes *********************************************************

app.get("/", (req: Request, res: Response):void => {
    res.send("Server working!")
})

// app.use("/api/v1/user", userRoutes);


// Serving static files
app.use(express.static(path.join(__dirname, "../uploads")));

//* Socket connection **********************************************

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      process.env.FRONTEND_URL || "",
    ],
    credentials: true,
  },
});

// io.on("connection", (socket) => {
//   socketFuncs(socket);
// });

//* Error Middleware ***********************************************

// Route not found
app.all("*", (req: Request, res: Response, next: NextFunction) => {
  next(
    new AppError(`Can't find ${req.originalUrl} route on this server!`, 404)
  );
});

// Global error handling
app.use(errorHandler);

export default server;
