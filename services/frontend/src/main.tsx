import ReactDOM from "react-dom/client";
import { ErrorBoundary } from "@/components/error/ErrorBoundary";
import App from "./App";
import "./index.css";

// Render the app
ReactDOM.createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
