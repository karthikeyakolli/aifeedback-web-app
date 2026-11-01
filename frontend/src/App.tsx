import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import { HomePage } from './pages/HomePage';
import { ExplorePage } from './pages/ExplorePage';
import { CreatePostPage } from './pages/CreatePostPage';
import { PostDetailPage } from './pages/PostDetailPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { SavedPostsPage } from './pages/SavedPostsPage';
import { MyActivityPage } from './pages/MyActivityPage';
import { SettingsPage } from './pages/SettingsPage';
import { ModerationPage } from './pages/ModerationPage';
import { DeveloperWorkspacePage } from './pages/DeveloperWorkspacePage';
import { NotFoundPage } from './pages/NotFoundPage';

import { LoginPage } from './pages/auth/LoginPage';
import { SignupPage } from './pages/auth/SignupPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { VerifyEmailPage } from './pages/auth/VerifyEmailPage';
import { AuthCallbackPage } from './pages/auth/AuthCallbackPage';

import { AuthModal } from './components/auth/AuthModal';

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AuthModal />
        <BrowserRouter>
          <Routes>
            {/* Standalone Authentication Pages (Section 6) */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/auth/callback" element={<AuthCallbackPage />} />

            {/* Global Application Shell Routes (Section 5) */}
            <Route element={<AppLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/explore" element={<ExplorePage />} />
              <Route path="/create" element={<CreatePostPage />} />
              <Route path="/posts/:id" element={<PostDetailPage />} />
              <Route path="/discussions/:id" element={<PostDetailPage />} />
              <Route path="/products/:id" element={<ProductDetailPage />} />
              <Route path="/saved" element={<SavedPostsPage />} />
              <Route path="/activity" element={<MyActivityPage />} />
              <Route path="/moderation" element={<ModerationPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/developer" element={<DeveloperWorkspacePage />} />
              <Route path="/developer/ai-lab" element={<DeveloperWorkspacePage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
