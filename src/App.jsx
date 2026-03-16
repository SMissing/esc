
import React from 'react';
import { HashRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Leaderboard from './Leaderboard';
import Admin from './Admin';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/" element={<Leaderboard />} />
      </Routes>
    </Router>
  );
}

export default App
