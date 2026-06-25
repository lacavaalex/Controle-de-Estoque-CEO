import "dotenv/config";
import express from "express";
import { router } from "./routes/routes.js";
import { validarConfigJwt } from "./auth/jwt.js";

// Fail-fast: aborta o boot se a config de JWT (segredo/expiração) estiver
// ausente ou malformada (ADR-0005), em vez de emitir tokens quebrados depois.
validarConfigJwt();

const app = express();

// Dev (WSL + browser no Windows): permite o front chamar :3000 direto quando o
// proxy do Vite falha. Em produção o proxy reverso / mesma origem cobre isso.
if (process.env.NODE_ENV !== "production") {
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Vary", "Origin");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
      res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,PUT,DELETE,OPTIONS");
    }
    if (req.method === "OPTIONS") {
      res.status(204).end();
      return;
    }
    next();
  });
}

app.use(express.json());
app.use(router);

// Última linha de defesa: erros async não tratados viram 500 em vez de derrubar o processo.
app.use(
  (err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error("[api] Erro não tratado:", err);
    if (res.headersSent) return;
    res.status(500).json({ error: "Erro interno do servidor" });
  },
);

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is listening on port ${PORT}`)
})