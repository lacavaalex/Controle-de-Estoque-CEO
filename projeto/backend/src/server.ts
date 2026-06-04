import "dotenv/config";
import express from "express";
import { router } from "./routes/routes.js";
import { validarConfigJwt } from "./auth/jwt.js";

// Fail-fast: aborta o boot se a config de JWT (segredo/expiração) estiver
// ausente ou malformada (ADR-0005), em vez de emitir tokens quebrados depois.
validarConfigJwt();

const app = express();
app.use(express.json());
app.use(router)


const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is listening on port ${PORT}`)
})