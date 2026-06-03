import { JsonItemRepo } from "../repositories/JsonItemRepo.js";
import { ItemService } from "../services/ItemService.js";
import { ItemController } from "../controller/ItemController.js";

import { JsonUserRepo } from "../repositories/JsonUserRepo.js";
import { UserService } from "../services/UserService.js";
import { UserController } from "../controller/UserController.js";

// Stack v2: persistência Postgres (Drizzle) + auth real (JWT + RBAC).
import { PgUsuarioRepo } from "../repositories/PgUsuarioRepo.js";
import { PgSetorRepo } from "../repositories/PgSetorRepo.js";
import { PgProdutoRepo } from "../repositories/PgProdutoRepo.js";
import { PgLoteRepo } from "../repositories/PgLoteRepo.js";
import { AuthService } from "../services/AuthService.js";
import { AuthController } from "../controller/AuthController.js";
import { EstoqueService } from "../services/EstoqueService.js";

// --- Legado v1 (Item/User em JSON) — mantido até a migração das rotas ---
const itemRepo = new JsonItemRepo();
const itemService = new ItemService(itemRepo);
const itemController = new ItemController(itemService);

const userRepo = new JsonUserRepo();
const userService = new UserService(userRepo);
const userController = new UserController(userService);

// --- v2 (Postgres + auth) ---
const usuarioRepo = new PgUsuarioRepo();
const setorRepo = new PgSetorRepo();
const produtoRepo = new PgProdutoRepo();
const loteRepo = new PgLoteRepo();

const authService = new AuthService(usuarioRepo, setorRepo);
const authController = new AuthController(authService);

const estoqueService = new EstoqueService(produtoRepo, loteRepo, setorRepo);

export {
  itemController,
  userController,
  authController,
  setorRepo,
  estoqueService,
};
