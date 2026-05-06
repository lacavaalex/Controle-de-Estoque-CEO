import express from 'express'
import {itemController} from '../di/container.js'

const router = express.Router();

router.patch('/items/:id/stock', (req,res) => itemController.addStock(req,res));

export {router}
