import { describe, it, expect, vi } from "vitest";
import { LoteService } from "./LoteService.js";

describe("LoteService.removerLote", () => {
  it("deve lançar erro ao tentar remover um lote inexistente", async () => {
    const mockTx = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]),
    };
    const mockDb = {
      transaction: vi.fn().mockImplementation((cb) => cb(mockTx)),
    };

    const service = new LoteService(mockDb as any);
    await expect(service.removerLote(1)).rejects.toThrow("Lote não encontrado");
  });

  it("deve lançar erro ao tentar remover um lote associado a um item do pedido", async () => {
    const mockTx = {
      select: vi.fn()
        .mockImplementationOnce(() => ({
          from: () => ({
            where: () => ({
              limit: () => Promise.resolve([{ id: 1 }]),
            }),
          }),
        }))
        .mockImplementationOnce(() => ({
          from: () => ({
            where: () => ({
              limit: () => Promise.resolve([{ id: 10 }]),
            }),
          }),
        })),
    };
    const mockDb = {
      transaction: vi.fn().mockImplementation((cb) => cb(mockTx)),
    };

    const service = new LoteService(mockDb as any);
    await expect(service.removerLote(1)).rejects.toThrow(
      "Não é possível remover um lote que possui expedições associadas"
    );
  });

  it("deve remover com sucesso um lote e manter suas movimentações", async () => {
    const mockDelete = vi.fn().mockReturnThis();
    const mockWhere = vi.fn().mockResolvedValue(true);

    const mockTx = {
      select: vi.fn()
        .mockImplementationOnce(() => ({
          from: () => ({
            where: () => ({
              limit: () => Promise.resolve([{ id: 1 }]),
            }),
          }),
        }))
        .mockImplementationOnce(() => ({
          from: () => ({
            where: () => ({
              limit: () => Promise.resolve([]),
            }),
          }),
        })),
      delete: mockDelete.mockImplementation(() => ({
        where: mockWhere,
      })),
    };
    const mockDb = {
      transaction: vi.fn().mockImplementation((cb) => cb(mockTx)),
    };

    const service = new LoteService(mockDb as any);
    await service.removerLote(1);

    expect(mockDelete).toHaveBeenCalledTimes(1);
  });
});
