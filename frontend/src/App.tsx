import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { SpaceProvider } from './context/SpaceContext';
import { AppLayout } from './components/layout/AppLayout';
import { HomePage } from './pages/HomePage';
import { ExplorePage } from './pages/ExplorePage';
import { DiscussionsPage } from './pages/DiscussionsPage';
import { PostDetailPage } from './pages/PostDetailPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { ProjectDetailPage } from './pages/ProjectDetailPage';
import { PublishProjectPage } from './pages/PublishProjectPage';
import { AIWorkspacePage } from './pages/AIWorkspacePage';
import { ProfilePage } from './pages/ProfilePage';
import { SavedPostsPage } from './pages/SavedPostsPage';
import { MyActivityPage } from './pages/MyActivityPage';
import { SettingsPage } from './pages/SettingsPage';
import { ModerationPage } from './pages/ModerationPage';
import { NotFoundPage } from './pages/NotFoundPage';

import { PersonalHomePage } from './pages/personal/PersonalHomePage';
import { NewProjectPage } from './pages/personal/NewProjectPage';
import { ProjectSetupPage } from './pages/personal/ProjectSetupPage';
import { FeedbackReportPage } from './pages/personal/FeedbackReportPage';

import { CreatorStudioPage } from './pages/creator/CreatorStudioPage';
import { CreatorProfilePage } from './pages/creator/CreatorProfilePage';
import { PublicCreatorProfilePage } from './pages/creator/PublicCreatorProfilePage';

import { LoginPage } from './pages/auth/LoginPage';
import { SignupPage } from './pages/auth/SignupPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { VerifyEmailPage } from './pages/auth/VerifyEmailPage';
import { AuthCallbackPage } from './pages/auth/AuthCallbackPage';

import { AuthModal } from './components/auth/AuthModal';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

export function App() {
  useEffect(() => {
    // Eagerly pre-warm backend so any standby instance begins waking up before user interactions
    const prewarmUrl = import.meta.env.VITE_API_URL
      ? `${import.meta.env.VITE_API_URL}/health`
      : 'https://aifeedback-web-app.onrender.com/api/v1/health';

    fetch(prewarmUrl, { mode: 'no-cors', keepalive: true }).catch(() => {});
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <AuthModal />
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <SpaceProvider>
            <Routes>
              {/* Standalone Authentication Pages */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/sign-in" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/sign-up" element={<SignupPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/verify-email" element={<VerifyEmailPage />} />
              <Route path="/auth/callback" element={<AuthCallbackPage />} />

              {/* Global Application Shell Routes */}
              <Route element={<AppLayout />}>
                {/* One Unified Navigation Public Exploration Routes */}
                <Route path="/" element={<HomePage />} />
                <Route path="/explore" element={<ExplorePage />} />
                <Route path="/public" element={<ExplorePage />} />
                <Route path="/discussions" element={<DiscussionsPage />} />
            <Route path="/public/discussions" element={<DiscussionsPage />} />

                {/* Dedicated Unified Project Detail & Discussion */}
                <Route path="/projects/:id" element={<ProjectDetailPage />} />
                <Route path="/public/projects/:id" element={<ProjectDetailPage />} />
                <Route path="/posts/:id" element={<PostDetailPage />} />
                <Route path="/discussions/:id" element={<PostDetailPage />} />
                <Route path="/products/:id" element={<ProductDetailPage />} />

                {/* Public Creator Showcase */}
                <Route path="/creators/:username" element={<PublicCreatorProfilePage />} />
                <Route path="/public/creators/:username" element={<PublicCreatorProfilePage />} />

                {/* Authenticated Unified Routes - Protected (Login Required) */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/workspace" element={<AIWorkspacePage />} />
                  <Route path="/assistant" element={<AIWorkspacePage />} />
                  <Route path="/publish" element={<PublishProjectPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/my-projects" element={<ProfilePage />} />
                  <Route path="/saved" element={<SavedPostsPage />} />
                  <Route path="/activity" element={<MyActivityPage />} />

                  {/* Deep Project Workspace & Setup */}
                  <Route path="/personal" element={<PersonalHomePage />} />
                  <Route path="/personal/projects/new" element={<NewProjectPage />} />
                  <Route path="/personal/projects/:id" element={<ProjectSetupPage />} />
                  <Route path="/personal/projects/:id/setup" element={<ProjectSetupPage />} />
                  <Route path="/personal/projects/:id/report" element={<FeedbackReportPage />} />
                  <Route path="/projects/:id/report" element={<FeedbackReportPage />} />
                  <Route path="/create" element={<PublishProjectPage />} />

                  {/* Creator Tools */}
                  <Route path="/creator" element={<CreatorStudioPage />} />
                  <Route path="/creator/profile" element={<CreatorProfilePage />} />

                  {/* Account Settings */}
                  <Route path="/settings" element={<SettingsPage />} />
                </Route>

                {/* Administrative Moderation - Staff Role Guard */}
                <Route element={<ProtectedRoute requireModerator />}>
                  <Route path="/moderation" element={<ModerationPage />} />
                </Route>

                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Routes>
          </SpaceProvider>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
export default App;
