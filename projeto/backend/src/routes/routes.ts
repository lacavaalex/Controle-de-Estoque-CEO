import express from "express";
import { itemController, userController } from "../di/container.js";

const router = express.Router();

router.patch('/items/:id', (req,res) => itemController.addStock(req,res));
router.patch('/items/:id/name', (req, res) => itemController.changeItemName(req, res));

router.post('/login', (req, res) => userController.login(req, res));
router.post('/registrar', (req, res) => userController.register(req, res));

export { router };