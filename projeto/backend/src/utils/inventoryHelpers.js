function formatQuantity(qtd) {
    const parsed = parseInt(qtd);
    if (isNaN(parsed)) return 1;
    return Math.max(1, parsed);
}

function formatPrice(price) {
    const parsed = parseFloat(price);
    if (isNaN(parsed)) return 0.01;
    return Math.max(0.01, parsed);
}

module.exports = { formatQuantity, formatPrice };