import React from 'react';
// Importamos os componentes da biblioteca de rotas que instalamos
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Importando as nossas páginas
import Login from './pages/Login';
import Cadastro from './pages/Cadastro';

// Função principal que o Vite usa para renderizar o app no navegador
function App() {
  return (
    // O Router serve para monitorar o endereço (URL) do navegador
    <Router>
      <Routes>
        {/* Definindo que o caminho vazio (/) mostra o Login */}
        <Route path="/" element={<Login />} />
        
        {/* Definindo que o caminho (/cadastro) mostra o Cadastro */}
        <Route path="/cadastro" element={<Cadastro />} />
      </Routes>
    </Router>
  );
}

export default App;