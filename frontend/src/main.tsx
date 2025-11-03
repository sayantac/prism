import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App";
import "./index.css";

// Error boundary for the entire app
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("App Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-base-200">
          <div className="text-center p-8">
            <h1 className="text-2xl font-bold text-error mb-4">
              Oops! Something went wrong
            </h1>
            <p className="text-base-content/70 mb-6">
              We're sorry for the inconvenience. Please try refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="btn btn-primary"
            >
              Refresh Page
            </button>
            {this.state.error && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-base-content/50">
                  Error Details (Development)
                </summary>
                <pre className="mt-2 text-xs bg-base-300 p-4 rounded overflow-auto">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Render the app
ReactDOM.createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
