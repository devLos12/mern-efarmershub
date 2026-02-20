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
      
      
      // Get allowed origins from environment variable
      const allowedOrigins = process.env.ALLOWED_ORIGINS 
        ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
        : [];
      
      
      const corsOption = {
        origin: function (origin, callback) {
          // Allow requests with no origin (like mobile apps or curl requests)
          if (!origin) return callback(null, true);
          
          if (allowedOrigins.includes(origin)) {
            callback(null, true);
          } else {
            callback(new Error('Not allowed by CORS'));
          }
        },
        credentials: true,
      };


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
        console.log(`Server is running on port ${port}`);
      });
      

      const io = new Server(server, {
        cors: {
          origin: allowedOrigins,
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
