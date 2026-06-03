import "dotenv/config";
import express from "express";
import { router } from "./routes/routes.js";


const app = express();
app.use(express.json());
app.use(router)


const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is listening on port ${PORT}`)
})