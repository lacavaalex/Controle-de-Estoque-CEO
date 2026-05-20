import { JsonItemRepo } from "../repositories/JsonItemRepo.js";
import { ItemService } from "../services/ItemService.js";
import { ItemController } from "../controller/ItemController.js";

import { JsonUserRepo } from "../repositories/JsonUserRepo.js";
import { UserService } from "../services/UserService.js";
import { UserController } from "../controller/UserController.js";

const itemRepo = new JsonItemRepo();
const itemService = new ItemService(itemRepo);
const itemController = new ItemController(itemService);

const userRepo = new JsonUserRepo();
const userService = new UserService(userRepo);
const userController = new UserController(userService);

export { itemController, userController };