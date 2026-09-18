import { useState } from 'react';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import './App.css';
import Landing from './pages/Home/landing';
import Patners from './pages/Home/partners';
import Tours from './pages/Home/tours';
import Support from './pages/Home/support';

function App() {


  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/Home/partners" element={<Patners />} />
        <Route path="/Home/tours" element={<Tours />} />
        <Route path="/Home/support" element={<Support />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
