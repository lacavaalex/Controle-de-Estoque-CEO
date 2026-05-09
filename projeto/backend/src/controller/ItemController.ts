import type { IItemService } from "../interfaces/service-interfaces/IItemService.js";
import type { Request, Response } from "express";


export class ItemController {
    constructor(private itemService: IItemService){}

    async addStock(req: Request<{id: string}>, res: Response): Promise<Response> {
        const {id} = req.params;
        const {quantity} = req.body;

        try {
            const updatedItem = await this.itemService.addStock(id, quantity);
            return res.status(200).json(updatedItem);
        } catch (error) {
            if (error instanceof Error){
                return res.status(400).json({error: error.message});
            } else {
                return res.status(500).json({error: "Erro interno do servidor"});
            }
        }


    }
}