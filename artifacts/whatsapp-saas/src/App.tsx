import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Route, Switch, Router as WouterRouter, Redirect } from 'wouter';
import { Suspense, lazy } from 'react';

import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { CompanyProvider, useCompany } from '@/contexts/CompanyContext';
import { AppLayout } from '@/layouts/AppLayout';

import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import CreateCompany from '@/pages/CreateCompany';
import NotFound from '@/pages/not-found';

const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Chats = lazy(() => import('@/pages/Chats'));
const Flows = lazy(() => import('@/pages/Flows'));
const Contacts = lazy(() => import('@/pages/Contacts'));
const Connections = lazy(() => import('@/pages/Connections'));
const Products = lazy(() => import('@/pages/Products'));
const Orders = lazy(() => import('@/pages/Orders'));
const Settings = lazy(() => import('@/pages/Settings'));

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="flex h-full items-center justify-center text-muted-foreground">
    Carregando...
  </div>
);

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, isLoading } = useAuth();
  const { hasCompany } = useCompany();

  if (isLoading) return <PageLoader />;
  if (!isAuthenticated) return <Redirect to="/login" />;
  if (!hasCompany) return <Redirect to="/create-company" />;

  return (
    <AppLayout>
      <Suspense fallback={<PageLoader />}>
        <Component />
      </Suspense>
    </AppLayout>
  );
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();
  const { hasCompany } = useCompany();

  if (isLoading) return <PageLoader />;

  return (
    <Switch>
      <Route path="/">
        {isAuthenticated && hasCompany
          ? <Redirect to="/dashboard" />
          : isAuthenticated
          ? <Redirect to="/create-company" />
          : <Redirect to="/login" />}
      </Route>

      {/* Public routes */}
      <Route path="/login">
        {isAuthenticated ? <Redirect to={hasCompany ? '/dashboard' : '/create-company'} /> : <Login />}
      </Route>
      <Route path="/register">
        {isAuthenticated ? <Redirect to={hasCompany ? '/dashboard' : '/create-company'} /> : <Register />}
      </Route>
      <Route path="/forgot-password" component={ForgotPassword} />

      {/* Onboarding — requires auth, no company yet */}
      <Route path="/create-company">
        {!isAuthenticated ? <Redirect to="/login" /> : <CreateCompany />}
      </Route>

      {/* Protected routes */}
      <Route path="/dashboard"><ProtectedRoute component={Dashboard} /></Route>
      <Route path="/chats"><ProtectedRoute component={Chats} /></Route>
      <Route path="/flows"><ProtectedRoute component={Flows} /></Route>
      <Route path="/contacts"><ProtectedRoute component={Contacts} /></Route>
      <Route path="/connections"><ProtectedRoute component={Connections} /></Route>
      <Route path="/products"><ProtectedRoute component={Products} /></Route>
      <Route path="/orders"><ProtectedRoute component={Orders} /></Route>
      <Route path="/settings"><ProtectedRoute component={Settings} /></Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CompanyProvider>
          <TooltipProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
              <Router />
            </WouterRouter>
            <Toaster />
          </TooltipProvider>
        </CompanyProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
