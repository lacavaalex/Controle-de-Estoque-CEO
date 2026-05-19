import express from "express";
import { itemController } from "../di/container.js";

const router = express.Router();

router.patch('/items/:id', (req,res) => itemController.addStock(req,res));
router.patch('/items/:id/name', (req, res) => itemController.changeItemName(req, res));

export {router}