import express from "express";
import { itemController } from "../di/container.js";

const router = express.Router();

router.get("/items",          (req, res) => itemController.listAll(req, res));
router.get("/items/:id",      (req, res) => itemController.getById(req, res));
router.post("/items",         (req, res) => itemController.create(req, res));
router.patch("/items/:id",    (req, res) => itemController.addStock(req, res));
router.put("/items/:id",      (req, res) => itemController.update(req, res));
router.delete("/items/:id",   (req, res) => itemController.delete(req, res));

export { router };
