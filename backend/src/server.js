
import express from "express"
import cors from "cors";
import cookieParser from "cookie-parser";
import collectionRoutes from "./routes/collectionRoutes.js"
import deckRoutes from "./routes/deckRoutes.js"
import cardRoutes from "./routes/cardRoutes.js"
import authRoutes from "./routes/authRoutes.js"
import { requireAuth } from "./middleware/authMiddleware.js"
import { connectDB } from "./config/db.js"
import dotenv from 'dotenv';
dotenv.config();

const app = express()
const PORT = process.env.PORT || 5001;

connectDB();

// middleware parses the JSON bodies, req body
app.use(cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
    credentials: true,
}));
app.use(express.json())
app.use(cookieParser());

// Custom middleware
app.use((req, res, next) => {
    console.log(`Req method is ${req.method} & Req URL is ${req.url}`);
    next();
})

app.use("/api/auth", authRoutes)
app.use("/api/collections", requireAuth, collectionRoutes)
app.use("/api/decks", requireAuth, deckRoutes)
app.use("/api/cards", requireAuth, cardRoutes)

app.listen(PORT, () => {
    console.log("Server started on port:", PORT)
})


