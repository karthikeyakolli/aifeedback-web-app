import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { SpaceProvider } from './context/SpaceContext';
import { AppLayout } from './components/layout/AppLayout';
import { HomePage } from './pages/HomePage';
import { ExplorePage } from './pages/ExplorePage';
import { PostDetailPage } from './pages/PostDetailPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { PublicProjectDetailPage } from './pages/public/PublicProjectDetailPage';
import { SavedPostsPage } from './pages/SavedPostsPage';
import { MyActivityPage } from './pages/MyActivityPage';
import { SettingsPage } from './pages/SettingsPage';
import { ModerationPage } from './pages/ModerationPage';
import { DeveloperWorkspacePage } from './pages/DeveloperWorkspacePage';
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
  return (
    <ThemeProvider>
      <AuthProvider>
        <AuthModal />
        <BrowserRouter>
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
                {/* Public Space (PUB-00 to PUB-03) */}
                <Route path="/" element={<HomePage />} />
                <Route path="/public" element={<ExplorePage />} />
                <Route path="/explore" element={<ExplorePage />} />
                <Route path="/discussions" element={<ExplorePage />} />
                <Route path="/posts/:id" element={<PostDetailPage />} />
                <Route path="/discussions/:id" element={<PostDetailPage />} />
                <Route path="/products/:id" element={<ProductDetailPage />} />
                <Route path="/public/projects/:id" element={<PublicProjectDetailPage />} />
                <Route path="/creators/:username" element={<PublicCreatorProfilePage />} />
                <Route path="/public/creators/:username" element={<PublicCreatorProfilePage />} />

                {/* Personal Space (PER-01 to PER-07) - Protected */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/personal" element={<PersonalHomePage />} />
                  <Route path="/personal/projects/new" element={<NewProjectPage />} />
                  <Route path="/personal/projects/:id" element={<ProjectSetupPage />} />
                  <Route path="/personal/projects/:id/setup" element={<ProjectSetupPage />} />
                  <Route path="/personal/projects/:id/report" element={<FeedbackReportPage />} />
                  <Route path="/projects/:id/report" element={<FeedbackReportPage />} />
                  <Route path="/create" element={<NewProjectPage />} />
                  <Route path="/saved" element={<SavedPostsPage />} />
                  <Route path="/activity" element={<MyActivityPage />} />

                  {/* Creator Space (CRE-01 to CRE-03) - Protected */}
                  <Route path="/creator" element={<CreatorStudioPage />} />
                  <Route path="/creator/profile" element={<CreatorProfilePage />} />
                  <Route path="/creator/lab" element={<DeveloperWorkspacePage />} />

                  {/* Account Settings - Protected */}
                  <Route path="/settings" element={<SettingsPage />} />
                </Route>

                {/* Administrative Moderation - Staff Role Guard */}
                <Route element={<ProtectedRoute requireModerator />}>
                  <Route path="/moderation" element={<ModerationPage />} />
                </Route>

                {/* Developer Diagnostic Workspace */}
                <Route path="/developer" element={<DeveloperWorkspacePage />} />
                <Route path="/developer/ai-lab" element={<DeveloperWorkspacePage />} />
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
