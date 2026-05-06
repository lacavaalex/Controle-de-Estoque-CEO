export class ItemController{
    constructor(itemService){
        this.itemService = itemService;
    }

    async addStock(req,res){
        const id = req.params.id;
        const quantity = req.body.quantity;

        try {
            const updatedItem = await this.itemService.addStock(id, quantity);
            res.status(200).json(updatedItem);
        } catch (error) {
            if (error.message.includes("ID")){
                res.status(404).json({error: error.message})
            } else {
                res.status(400).json({error: error.message})
            }
        }
    }
}