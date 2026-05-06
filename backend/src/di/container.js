import { ItemRepository } from "../repositories/itemRepository.js";
import { ItemService } from "../services/itemService.js";
import { ItemController } from "../controllers/itemController.js";


const itemRepository = new ItemRepository()
const itemService = new ItemService(itemRepository)
const itemController = new ItemController(itemService)

export {itemController}