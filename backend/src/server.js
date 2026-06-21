
import express from "express"
import cors from "cors";
import collectionRoutes from "./routes/collectionRoutes.js"
import deckRoutes from "./routes/deckRoutes.js"
import { connectDB } from "./config/db.js"
import dotenv from 'dotenv';
dotenv.config();

const app = express()
const PORT = process.env.PORT || 5001;

connectDB();

// middleware parses the JSON bodies, req body
app.use(cors());
app.use(express.json()) 

// Custom middleware
app.use((req, res, next) => {
    console.log(`Req method is ${req.method} & Req URL is ${req.url}`);
    next();
})

app.use("/api/collections", collectionRoutes) 
app.use("/api/decks", deckRoutes)

app.listen(PORT, () => {
    console.log("Server started on port:", PORT)
})


