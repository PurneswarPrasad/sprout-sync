import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import HomePage from './pages/HomePage';
import { PlantsPage } from './pages/PlantsPage';
import { AddPlantPage } from './pages/AddPlantPage';
import { AIIdentificationPage } from './pages/AIIdentificationPage';
import { CalendarPage } from './pages/CalendarPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/home" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
          <Route path="/plants" element={<ProtectedRoute><PlantsPage /></ProtectedRoute>} />
          <Route path="/add-plant" element={<ProtectedRoute><AddPlantPage /></ProtectedRoute>} />
          <Route path="/ai-identification" element={<ProtectedRoute><AIIdentificationPage /></ProtectedRoute>} />
          <Route path="/calendar" element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;