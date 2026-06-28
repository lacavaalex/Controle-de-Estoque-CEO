import "dotenv/config";
import { criarApp } from "./app.js";
import { validarConfigJwt } from "./auth/jwt.js";

// Fail-fast: aborta o boot se a config de JWT (segredo/expiração) estiver
// ausente ou malformada (ADR-0005), em vez de emitir tokens quebrados depois.
validarConfigJwt();

const app = criarApp();

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is listening on port ${PORT}`);
});
