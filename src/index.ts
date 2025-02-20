// src/index.ts
import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import router from "./routs";
import notFound from "./middleware/notfound";
import config from "./config";
import cors from 'cors'
import multer from 'multer'
import cookieParser from 'cookie-parser';
import helmet from "helmet";
import connectDb from "./config/connectDb";
import globalErrorHandler from "./middleware/globalErrorhandler";
dotenv.config();

const app: Express = express();

multer();
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(cors({
  origin: [config.client_Root_Url!, 'http://192.168.10.133:5004'],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser())
app.use(express.static('public'));

const port = config.port || 3000;

connectDb()

app.get("/", (req: Request, res: Response) => {
  res.send("-------------------- 🎇 Server running 🎇 -------------------------");
});

app.use("/api", router);

app.use(notFound);

app.use(globalErrorHandler);


app.listen(port, () => {
  console.log(`[server]: Server is running at ${config.ip + ":" + port}`);
});
