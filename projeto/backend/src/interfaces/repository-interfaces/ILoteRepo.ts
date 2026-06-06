import type { Lote } from "../../entities/Lote.js";

// métodos de acesso ao banco de dados
export interface ILoteRepo {
    // cria um novo lote e retorna ele
    createLote(lote: Omit<Lote, "id" | "updated_at">): Promise<Lote>;

    // deleta um lote e se a operação foi bem sucessidade retorna true
    deleteLote(id: number): Promise<boolean>;

    // atualiza dados de um lotes
    updateLote(id: number, dados: Partial<Omit<Lote, "id" | "updated_at">>): Promise<Lote | null>;

    // encontra um lote pelo id do lote
    findLoteById(id: number): Promise<Lote | null>;

    // retorna um array de lotes de um único produto
    getAllLotesByProduct(product_id: number): Promise<Lote[]>;
    
    // retorna um array de lotes de acordo com a válidade
    findExpiringLotes(dias: number): Promise<Lote[]>;
}