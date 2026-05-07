const { formatQuantity, formatPrice } = require('./inventoryHelpers');

describe('Testes de Funções Puras - Inventário', () => {
    
    it('Deve garantir que a quantidade mínima seja 1 (Sucesso e Edge Case)', () => {
        expect(formatQuantity(10)).toBe(10);
        expect(formatQuantity(0)).toBe(1);
        expect(formatQuantity(-5)).toBe(1);
        expect(formatQuantity("abc")).toBe(1);
    });

    it('Deve garantir que o preço mínimo seja 0.01 (Sucesso e Edge Case)', () => {
        expect(formatPrice(15.5)).toBe(15.5);
        expect(formatPrice(0)).toBe(0.01);
        expect(formatPrice(-10)).toBe(0.01);
    });
});