import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import HomePage from './pages/HomePage';
import { PlantsPage } from './pages/PlantsPage';
import { AddPlantPage } from './pages/AddPlantPage';
import { AIIdentificationPage } from './pages/AIIdentificationPage';
import { CalendarPage } from './pages/CalendarPage';
import { PlantDetailPage } from './pages/PlantDetailPage';
import { SettingsPage } from './pages/SettingsPage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth-callback" element={<AuthCallbackPage />} />
          <Route path="/home" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
          <Route path="/plants" element={<ProtectedRoute><PlantsPage /></ProtectedRoute>} />
          <Route path="/add-plant" element={<ProtectedRoute><AddPlantPage /></ProtectedRoute>} />
          <Route path="/ai-identification" element={<ProtectedRoute><AIIdentificationPage /></ProtectedRoute>} />
          <Route path="/calendar" element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
          <Route path="/plants/:plantId" element={<ProtectedRoute><PlantDetailPage /></ProtectedRoute>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;