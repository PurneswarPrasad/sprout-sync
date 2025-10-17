import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import InitialLandingPage from './pages/InitialLandingPage';
import OnboardingPage from './pages/OnboardingPage';
import SignInPage from './pages/SignInPage';
import HomePage from './pages/HomePage';
import { PlantsPage } from './pages/PlantsPage';
import { AddPlantPage } from './pages/AddPlantPage';
import { AIIdentificationPage } from './pages/AIIdentificationPage';
import { CalendarPage } from './pages/CalendarPage';
import { PlantDetailPage } from './pages/PlantDetailPage';
import { AcceptGiftPage } from './pages/AcceptGiftPage';
import { TermsPage } from './pages/TermsPage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { NotificationPromptPage } from './pages/NotificationPromptPage';
import { SettingsPage } from './pages/SettingsPage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import PublicPlantProfile from './pages/PublicPlantProfile';
import { ProtectedRoute } from './components/ProtectedRoute';
import { NotificationProvider } from './components/NotificationProvider';
import './App.css'

function App() {
  return (
    <Router>
      <NotificationProvider>
        <div className="App">
          <Routes>
          <Route path="/" element={<InitialLandingPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/signin" element={<SignInPage />} />
          <Route path="/auth-callback" element={<AuthCallbackPage />} />
          <Route path="/terms-and-conditions" element={<TermsPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="/u/:username/:plantSlug" element={<PublicPlantProfile />} />
          <Route path="/notification-prompt" element={<ProtectedRoute><NotificationPromptPage /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
          <Route path="/home" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
          <Route path="/plants" element={<ProtectedRoute><PlantsPage /></ProtectedRoute>} />
          <Route path="/add-plant" element={<ProtectedRoute><AddPlantPage /></ProtectedRoute>} />
          <Route path="/ai-identification" element={<ProtectedRoute><AIIdentificationPage /></ProtectedRoute>} />
          <Route path="/calendar" element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
          <Route path="/plants/:plantId" element={<ProtectedRoute><PlantDetailPage /></ProtectedRoute>} />
          <Route path="/accept-gift/:token" element={<ProtectedRoute><AcceptGiftPage /></ProtectedRoute>} />
        </Routes>
        </div>
      </NotificationProvider>
    </Router>
  );
}

export default App;