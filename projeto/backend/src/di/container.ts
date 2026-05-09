import { JsonItemRepo } from "../repositories/JsonItemRepo.js";
import { ItemService } from "../services/ItemService.js";
import { ItemController } from "../controller/ItemController.js";

const itemRepo = new JsonItemRepo();
const itemService = new ItemService(itemRepo);
const itemController = new ItemController(itemService);

export {itemController}
