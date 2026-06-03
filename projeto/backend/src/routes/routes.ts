import express from "express";
import {
  itemController,
  userController,
  authController,
  setorRepo,
  estoqueService,
} from "../di/container.js";
import { autenticar, exigir } from "../auth/middleware.js";
import { podeVerSetor } from "../auth/rbac.js";

const router = express.Router();

// Middleware de autenticação (verifica o JWT em toda rota protegida — RNF03.7).
const auth = autenticar(setorRepo);

// ─── Autenticação (EP01) — públicas ────────────────────────────────────────
router.post("/login", (req, res) => authController.login(req, res));
router.post("/logout", (req, res) => authController.logout(req, res));

// ─── Autenticação — protegidas ───────────────────────────────────────────────
router.get("/eu", auth, (req, res) => authController.eu(req, res));
// Provisionamento de usuário por gestor (RBAC dentro do service — US-EP01-06).
router.post("/usuarios", auth, (req, res) => authController.provisionar(req, res));

// ─── Estoque (v2) — protegido por RBAC perfil×setor (RN12) ───────────────────
router.get(
  "/setores/:setorId/estoque",
  auth,
  exigir((id, req) => podeVerSetor(id, Number(req.params.setorId))),
  async (req, res) => {
    try {
      const setorId = Number(req.params.setorId);
      const estoque = await estoqueService.estoqueDoSetor(setorId);
      return res.status(200).json({ estoque });
    } catch (error) {
      if (error instanceof Error) return res.status(400).json({ mensagem: error.message });
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  },
);

// ─── Itens (legado v1) — mantidas até a migração para Produto/Lote ──────────
router.post("/items", async (req, res) => await itemController.createItem(req, res));
router.patch("/items/:id/stock", async (req, res) => await itemController.addStock(req, res));
router.patch("/items/:id/name", async (req, res) => await itemController.changeItemName(req, res));

// Cadastro legado (JSON) — substituído por POST /usuarios (v2). Mantido por ora.
router.post("/registrar", (req, res) => userController.register(req, res));

export { router };
