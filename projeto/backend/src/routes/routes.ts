import express from "express";
import { itemController, userController } from "../di/container.js";

const router = express.Router();

// Itens
router.post('/items', async (req,res) => await itemController.createItem(req,res));
router.patch('/items/:id/stock', async (req,res) => await itemController.addStock(req,res));
router.patch('/items/:id/name', async (req, res) => await itemController.changeItemName(req, res));
router.patch('/items/:id/category', async (req,res)=> await itemController.changeItemCategory(req, res))
router.get('/items', async (req,res)=> await itemController.listItems(req, res))

// Usuários
router.post('/login', (req, res) => userController.login(req, res));
router.post('/registrar', (req, res) => userController.register(req, res));

export { router };
