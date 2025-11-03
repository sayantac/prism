// src/App.tsx
import { useEffect } from "react";
import { Toaster } from "react-hot-toast";
import { Provider } from "react-redux";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { AdminProtectedRoute } from "./components/auth/AdminProtectedRoute";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { Layout } from "./components/layout/Layout";
import { store } from "./store/store";

// Pages
import { LoginPage } from "./pages/auth/LoginPage";
import { RegisterPage } from "./pages/auth/RegisterPage";
import { CartPage } from "./pages/checkout/CartPage";
import { CheckoutPage } from "./pages/checkout/CheckoutPage";
import { HomePage } from "./pages/HomePage";
import { ProductDetailPage } from "./pages/product/ProductDetailPage";
import { ProductsPage } from "./pages/product/ProductsPage";
import { SearchPage } from "./pages/product/SearchPage";

// User Pages
import { OrdersPage } from "./pages/user/OrdersPage";
import { ProfilePage } from "./pages/user/ProfilePage";

// Admin Pages
import { AdminRouter } from "./routes/AdminRouter";

function App() {
  useEffect(() => {
    // Set initial theme from localStorage or default to light
    const savedTheme = localStorage.getItem("theme") || "light";
    document.documentElement.setAttribute("data-theme", savedTheme);
    document.body.setAttribute("data-theme", savedTheme);

    // Also set class for compatibility
    document.documentElement.className = savedTheme;
    document.body.className = `bg-base-100 text-base-content min-h-screen`;
  }, []);

  return (
    <Provider store={store}>
      <Router>
        <div className="App">
          {/* Toast Notifications */}
          <Toaster
            position="bottom-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: "hsl(var(--b1))",
                color: "hsl(var(--bc))",
                border: "1px solid hsl(var(--b3))",
              },
              success: {
                iconTheme: {
                  primary: "hsl(var(--su))",
                  secondary: "hsl(var(--suc))",
                },
              },
              error: {
                iconTheme: {
                  primary: "hsl(var(--er))",
                  secondary: "hsl(var(--erc))",
                },
              },
            }}
          />

          <Routes>
            {/* Public Routes */}
            <Route
              path="/"
              element={
                <Layout>
                  <HomePage />
                </Layout>
              }
            />
            <Route
              path="/products"
              element={
                <Layout>
                  <ProductsPage />
                </Layout>
              }
            />
            <Route
              path="/products/:id"
              element={
                <Layout>
                  <ProductDetailPage />
                </Layout>
              }
            />
            <Route
              path="/search"
              element={
                <Layout>
                  <SearchPage />
                </Layout>
              }
            />
            <Route
              path="/trending"
              element={
                <Layout>
                  <ProductsPage />
                </Layout>
              }
            />
            <Route
              path="/new-arrivals"
              element={
                <Layout>
                  <ProductsPage />
                </Layout>
              }
            />
            <Route
              path="/categories"
              element={
                <Layout>
                  <ProductsPage />
                </Layout>
              }
            />

            {/* Auth Routes - No Layout wrapper */}
            <Route
              path="/login"
              element={
                <ProtectedRoute requireAuth={false} redirectTo="/">
                  <LoginPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/register"
              element={
                <ProtectedRoute requireAuth={false} redirectTo="/">
                  <RegisterPage />
                </ProtectedRoute>
              }
            />

            {/* Protected Routes */}
            <Route
              path="/cart"
              element={
                <ProtectedRoute>
                  <Layout>
                    <CartPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/checkout"
              element={
                <ProtectedRoute>
                  <Layout>
                    <CheckoutPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ProfilePage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/orders"
              element={
                <ProtectedRoute>
                  <Layout>
                    <OrdersPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/orders/:id"
              element={
                <ProtectedRoute>
                  <Layout>
                    <OrdersPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Admin Routes */}
            <Route
              path="/admin/*"
              element={
                <AdminProtectedRoute>
                  <AdminRouter />
                </AdminProtectedRoute>
              }
            />

            {/* 404 Page */}
            <Route
              path="*"
              element={
                <Layout>
                  <div className="container mx-auto px-4 py-16 text-center">
                    <h1 className="text-4xl font-bold text-base-content mb-4">
                      404
                    </h1>
                    <p className="text-base-content/70 mb-8">Page not found</p>
                    <a href="/" className="btn btn-primary">
                      Go Home
                    </a>
                  </div>
                </Layout>
              }
            />
          </Routes>
        </div>
      </Router>
    </Provider>
  );
}

export default App;
