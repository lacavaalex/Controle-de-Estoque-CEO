import { PgItemRepo } from "../repositories/PgItemRepo.js";
import { PgUsuarioRepo } from "../repositories/PgUsuarioRepo.js";
import { PgSolicitacaoRepo } from "../repositories/PgSolicitacaoRepo.js";
import { PgMovimentacaoRepo } from "../repositories/PgMovimentacaoRepo.js";
import { PgEstoqueCeoRepo } from "../repositories/PgEstoqueCeoRepo.js";
import { ItemService } from "../services/ItemService.js";
import { ItemController } from "../controller/ItemController.js";
import { JsonItemRepo } from "../repositories/JsonItemRepo.js";

const itemRepo         = new JsonItemRepo();
const usuarioRepo      = new PgUsuarioRepo();
const solicitacaoRepo  = new PgSolicitacaoRepo();
const movimentacaoRepo = new PgMovimentacaoRepo();
const estoqueCeoRepo   = new PgEstoqueCeoRepo();

const itemService    = new ItemService(itemRepo);
const itemController = new ItemController(itemService);

export {
  itemController,
  itemRepo,
  usuarioRepo,
  solicitacaoRepo,
  movimentacaoRepo,
  estoqueCeoRepo,
};
