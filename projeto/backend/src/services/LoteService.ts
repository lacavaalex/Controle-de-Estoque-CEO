// services/LoteService.ts
import type { Lote } from "../entities/Lote.js";
import type { ILoteService } from "../interfaces/service-interfaces/ILoteService.js";
import type { ILoteRepo } from "../interfaces/repository-interfaces/ILoteRepo.js";

export class LoteService implements ILoteService{
  constructor(private loteRepository: ILoteRepo) {}

  // Adiciona o lote de um item
  async addLote(
    product_id: number,
    sector_id: number,
    lot_number: string,
    expires_at: Date,
    quantity: number,
    manufactured_at?: Date,
  ): Promise<Lote> {
    // validação da existência do item no catálogo




    // validação de quantidade
    if (quantity <= 0) {
      throw new Error("Quantidade deve ser maior que zero");
    }
    // validação número do lote não está vázio
    if (lot_number.trim() === "") {
      throw new Error("Número do lote não pode ser vazio");
    }
    // validações de datas
    if (manufactured_at && manufactured_at > expires_at) {
      throw new Error("Data de fabricação não pode ser posterior à data de validade");
    }
    if (expires_at < new Date()) {
      throw new Error("Data de validade não pode ser no passado");
    }
    // cria o lote
    return await this.loteRepository.createLote({
      product_id,
      sector_id,
      lot_number,
      manufactured_at: manufactured_at ?? null,
      expires_at,
      quantity,
      status: "disponivel",
      segregated_at: null,
      segregation_note: null,
    });
  }
}