import connectDb from "./config/connect.js";
import express from "express";
import homeRouter from "./routes/homeRoute.js";
import adminRouter from "./routes/adminRoute.js";
import userRouter from "./routes/userRoute.js";
import sellerRouter from "./routes/sellerRoute.js";
import riderRouter from "./routes/riderRoute.js";
import cors from "cors";
import path from "path";
import { Server } from "socket.io";
import cookieParser from "cookie-parser";
import "./cron/index.js";



const startServer = async () => {
  try {
    await connectDb();
    const app = express();
    const port = process.env.PORT || 3000;

    const corsOption = {
      origin: true,
      credentials: true,
    }

    app.set('trust proxy', true);
    app.use(cors(corsOption));
    app.use(express.json());
    app.use(cookieParser());


    app.use('/api/Uploads', express.static(path.join(process.cwd(), 'uploads')));
    app.use("/api", homeRouter);
    app.use("/api", adminRouter);
    app.use("/api", userRouter);
    app.use("/api", sellerRouter);
    app.use("/api", riderRouter);
    

    const server = app.listen(port, "0.0.0.0", () => {
      console.log(`- Local:   http://localhost:${port}`);
      console.log(`- Network: http://192.168.43.150:${port}`);
    });

    
    const io = new Server(server, {
      cors: {
        origin: true,
        methods: ["GET", "POST", "DELETE"],
        credentials: true
      }
    })
    
    global.io = io;
    
  } catch (error) {
    console.error(`Failed to start server: ${error.message}`);
  }
};

startServer();
