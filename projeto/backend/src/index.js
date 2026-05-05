require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

const DATA_PATH = path.join(__dirname, 'itens.json');

app.use(express.static(path.join(__dirname, '../../frontend')));

app.post('/itens', (req, res) => {
    const { nome, quantidade, preco } = req.body;

    if (!nome || !quantidade || !preco) {
        return res.status(400).json({ erro: "Nome, Quantidade e Preço são obrigatórios." });
    }

    const qtdInserida = Math.max(1, parseInt(quantidade));
    const precoInserido = Math.max(0.01, parseFloat(preco));

    let itens = [];
    if (fs.existsSync(DATA_PATH)) {
        const conteudo = fs.readFileSync(DATA_PATH, 'utf-8');
        try {
            itens = JSON.parse(conteudo);
        } catch (e) {
            itens = [];
        }
    }

    const itemExistente = itens.find(item => 
        item.nome.toLowerCase() === nome.trim().toLowerCase() && 
        item.preco === precoInserido
    );

    if (itemExistente) {
        itemExistente.quantidade += qtdInserida;
        console.log(`Quantidade atualizada para ${itemExistente.nome}: ${itemExistente.quantidade}`);
    } else {
        const novoItem = {
            id: Date.now(),
            nome: nome.trim(),
            quantidade: qtdInserida,
            preco: precoInserido
        };
        itens.push(novoItem);
        console.log('Novo item criado:', novoItem);
    }

    try {
        fs.writeFileSync(DATA_PATH, JSON.stringify(itens, null, 2));
    } catch (err) {
        return res.status(500).json({ erro: "Erro ao salvar os dados no arquivo." });
    }

    res.status(201).json({
        mensagem: itemExistente ? "Quantidade somada ao item existente!" : "Item cadastrado com sucesso!",
        item: itemExistente || itens[itens.length - 1]
    });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});