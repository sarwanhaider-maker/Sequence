import { useState } from 'react';
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Boards from './components/Board';
import BotGame from './components/BotGame';

function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Boards />} />
        <Route path="/room/:roomId" element={<Boards />} />
        <Route path="/bot" element={<BotGame />} />
      </Routes>
      </BrowserRouter>
  );
}

export default App