import { JsonItemRepo } from "../repositories/JsonItemRepo.js";
import { ItemService } from "../services/ItemService.js";
import { ItemController } from "../controller/ItemController.js";
import { UsuarioController } from "../controller/UsuarioController.js";

// Stack v2: persistência Postgres (Drizzle) + auth real (JWT + RBAC).
import { PgUsuarioRepo } from "../repositories/PgUsuarioRepo.js";
import { PgSetorRepo } from "../repositories/PgSetorRepo.js";
import { PgProdutoRepo } from "../repositories/PgProdutoRepo.js";
import { PgLoteRepo } from "../repositories/PgLoteRepo.js";
import { AuthService } from "../services/AuthService.js";
import { AuthController } from "../controller/AuthController.js";
import { EstoqueService } from "../services/EstoqueService.js";
import { ProdutoService } from "../services/ProdutoService.js";
import { ProdutoController } from "../controller/ProdutoController.js";
import { LoteService } from "../services/LoteService.js";
import { LoteController } from "../controller/LoteController.js";
import { PgPedidoRepo } from "../repositories/PgPedidoRepo.js";
import { PedidoService } from "../services/PedidoService.js";
import { PedidoController } from "../controller/PedidoController.js";
import { PgRascunhoRepo } from "../repositories/PgRascunhoRepo.js";
import { RascunhoService } from "../services/RascunhoService.js";
import { RascunhoController } from "../controller/RascunhoController.js";
import { DashboardService } from "../services/DashboardService.js";
import { DashboardController } from "../controller/DashboardController.js";

// --- Legado v1 (Item/User em JSON) — mantido até a migração das rotas ---
const itemRepo = new JsonItemRepo();
const itemService = new ItemService(itemRepo);
const itemController = new ItemController(itemService);

// --- v2 (Postgres + auth) ---
const usuarioRepo = new PgUsuarioRepo();
const setorRepo = new PgSetorRepo();
const produtoRepo = new PgProdutoRepo();
const loteRepo = new PgLoteRepo();

const authService = new AuthService(usuarioRepo, setorRepo);
const authController = new AuthController(authService);

const estoqueService = new EstoqueService(produtoRepo, loteRepo, setorRepo);

const produtoService = new ProdutoService(produtoRepo, loteRepo);
const produtoController = new ProdutoController(produtoService);

const loteService = new LoteService();
const loteController = new LoteController(loteService, loteRepo);

const pedidoRepo = new PgPedidoRepo();
const pedidoService = new PedidoService(pedidoRepo);
const pedidoController = new PedidoController(pedidoService);
const usuarioController = new UsuarioController(usuarioRepo);

const dashboardService = new DashboardService(produtoRepo, loteRepo, pedidoRepo, estoqueService);
const dashboardController = new DashboardController(dashboardService);

// Agente de Email da Dispensação (EP08) — antecâmara de rascunhos + triagem.
const rascunhoRepo = new PgRascunhoRepo();
const rascunhoService = new RascunhoService(rascunhoRepo, pedidoRepo, usuarioRepo);
const rascunhoController = new RascunhoController(rascunhoService);

export {
  itemController,
  authController,
  setorRepo,
  estoqueService,
  produtoController,
  loteController,
  pedidoController,
  rascunhoController,
  usuarioController,
  dashboardController,
};
