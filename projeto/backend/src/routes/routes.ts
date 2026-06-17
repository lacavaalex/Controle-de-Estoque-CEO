import express from "express";
import {
  itemController,
  userController,
  authController,
  setorRepo,
  estoqueService,
  produtoController,
  loteController,
  pedidoController,
} from "../di/container.js";
import { autenticar, exigir } from "../auth/middleware.js";
import {
  podeVerSetor,
  podeEditarEstoque,
  podeCriarPedido,
  podeProcessarPedidos,
} from "../auth/rbac.js";
import type { FiltrosCatalogo } from "../services/EstoqueService.js";
import type { StatusProduto } from "../domain/estoque.js";

const router = express.Router();

// Middleware de autenticação (verifica o JWT em toda rota protegida — RNF03.7).
const auth = autenticar(setorRepo);

// Helper: extrai filtros de catálogo dos query params (US-EP02-03).
function filtrosDaQuery(q: express.Request["query"]): FiltrosCatalogo {
  const f: FiltrosCatalogo = {};
  if (typeof q.texto === "string") f.texto = q.texto;
  if (typeof q.categoria === "string") f.categoria = q.categoria;
  if (typeof q.status === "string") f.status = q.status as StatusProduto;
  if (q.somenteComEstoque === "true") f.somenteComEstoque = true;
  if (q.somenteSemEstoque === "true") f.somenteSemEstoque = true;
  return f;
}

// ─── Autenticação (EP01) ─────────────────────────────────────────────────────
router.post("/login", (req, res) => authController.login(req, res));
router.post("/logout", (req, res) => authController.logout(req, res));
router.get("/eu", auth, (req, res) => authController.eu(req, res));
router.post("/usuarios", auth, (req, res) => authController.provisionar(req, res));

// ─── Setores ─────────────────────────────────────────────────────────────────

// Lista os setores (HO/CEO...). Autenticada: qualquer usuário logado pode listar
// — o front precisa para escolher origem/destino ao criar pedido (EP04). Não
// expõe dado sensível (só nome/tipo/email do setor); sem filtro por escopo.
router.get("/setores", auth, async (_req, res) => {
  try {
    const setores = await setorRepo.listar();
    return res.status(200).json({ setores });
  } catch (error) {
    if (error instanceof Error) return res.status(400).json({ mensagem: error.message });
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// ─── Catálogo / Estoque (EP02) ───────────────────────────────────────────────

// US-EP02-01 + EP02-03 — catálogo agregado (almoxarife/gestor HO veem detalhe).
router.get(
  "/setores/:setorId/estoque",
  auth,
  exigir((id, req) => podeVerSetor(id, Number(req.params.setorId))),
  async (req, res) => {
    try {
      const setorId = Number(req.params.setorId);
      const estoque = await estoqueService.estoqueDoSetor(setorId, filtrosDaQuery(req.query));
      return res.status(200).json({ estoque });
    } catch (error) {
      if (error instanceof Error) return res.status(400).json({ mensagem: error.message });
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  },
);

// US-EP02-07 — catálogo do solicitante (agregado, SEM lote — RN12).
router.get(
  "/setores/:setorId/catalogo",
  auth,
  exigir((id, req) => podeVerSetor(id, Number(req.params.setorId))),
  async (req, res) => {
    try {
      const setorId = Number(req.params.setorId);
      const catalogo = await estoqueService.catalogoParaSolicitante(
        setorId,
        filtrosDaQuery(req.query),
      );
      return res.status(200).json({ catalogo });
    } catch (error) {
      if (error instanceof Error) return res.status(400).json({ mensagem: error.message });
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  },
);

// US-EP02-04 — cadastrar produto (só quem edita estoque do HO).
router.post(
  "/produtos",
  auth,
  exigir((id) => podeEditarEstoque(id, id.setorId) && id.setorTipo === "almoxarifado"),
  (req, res) => produtoController.cadastrar(req, res),
);

// US-EP02-06 — editar / remover produto.
router.patch(
  "/produtos/:id",
  auth,
  exigir((id) => id.setorTipo === "almoxarifado" && podeEditarEstoque(id, id.setorId)),
  (req, res) => produtoController.editar(req, res),
);
router.delete(
  "/produtos/:id",
  auth,
  exigir((id) => id.setorTipo === "almoxarifado" && podeEditarEstoque(id, id.setorId)),
  (req, res) => produtoController.remover(req, res),
);

// US-EP02-02 — lotes de um produto (não exibidos a solicitante).
router.get(
  "/produtos/:id/lotes",
  auth,
  exigir((id, req) => {
    const setorId = Number(req.query.setorId ?? id.setorId);
    // solicitante não vê lote (RN12); demais conforme escopo de setor.
    if (id.perfil === "solicitante") return false;
    return podeVerSetor(id, setorId);
  }),
  (req, res) => loteController.listarPorProduto(req, res),
);

// US-EP02-05 — entrada de lote (recebimento) — almoxarife/gestor HO.
// Recebimento de fornecedor é exclusivo do almoxarifado (HO); lotes-CEO só
// nascem via expedição (RN19), nunca por este endpoint.
router.post(
  "/produtos/:id/lotes",
  auth,
  exigir((id, req) => {
    const setorId = Number(req.body?.setorId ?? id.setorId);
    return id.setorTipo === "almoxarifado" && podeEditarEstoque(id, setorId);
  }),
  (req, res) => loteController.registrarEntrada(req, res),
);

// US-EP02-06 — ajuste de quantidade do lote.
router.patch(
  "/lotes/:loteId/quantidade",
  auth,
  exigir((id) => id.perfil === "gestor" || id.perfil === "almoxarife"),
  (req, res) => loteController.ajustar(req, res),
);

// ─── Pedidos (EP03 expedição / EP04-01 criação) ─────────────────────────────

// EP04-01 — criar pedido (solicitante/gestor do setor de origem — RN12).
router.post(
  "/pedidos",
  auth,
  exigir((id, req) => podeCriarPedido(id, Number(req.body?.setorOrigemId ?? id.setorId))),
  (req, res) => pedidoController.criar(req, res),
);

// Detalhe de um pedido (escopo de setor verificado no controller pelos dados do pedido).
router.get("/pedidos/:id", auth, (req, res) => pedidoController.detalhar(req, res));

// Pedidos de um setor (origem ou destino) — RN12.
router.get(
  "/setores/:setorId/pedidos",
  auth,
  exigir((id, req) => podeVerSetor(id, Number(req.params.setorId))),
  (req, res) => pedidoController.listarPorSetor(req, res),
);

// EP03 — expedir um item do pedido (almoxarife/gestor HO — RN11/RN19).
router.post(
  "/pedidos/:id/itens/:itemId/expedir",
  auth,
  exigir((id) => podeProcessarPedidos(id)),
  (req, res) => pedidoController.expedir(req, res),
);

// ─── Itens (legado v1) — mantidas até a migração para Produto/Lote ──────────
router.post("/items", async (req, res) => await itemController.createItem(req, res));
router.patch("/items/:id/stock", async (req, res) => await itemController.addStock(req, res));
router.patch("/items/:id/name", async (req, res) => await itemController.changeItemName(req, res));
router.post("/registrar", (req, res) => userController.register(req, res));

export { router };
