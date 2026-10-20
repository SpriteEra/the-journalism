import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import store from "./redux/store.js";
import { Provider } from "react-redux";
import { Toaster } from "react-hot-toast";
import { ReactQueryProvider } from "./providers/ReactQueryProvider.jsx";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ThemeProvider } from "./utils/Theme.jsx";
import "./i18n";
import { ConfirmProvider } from "./components/ui/ConfirmProvider.jsx";

createRoot(document.getElementById("root")).render(
  <Provider store={store}>
    <ReactQueryProvider>
      <ReactQueryDevtools initialIsOpen={false} />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: { background: "var(--surface)", color: "var(--fg)", border: "1px solid var(--line)", boxShadow: "var(--shadow-pop)", borderRadius: "var(--radius-control)", fontSize: "0.875rem" },
          success: { iconTheme: { primary: "var(--success)", secondary: "var(--surface)" } },
          error: { iconTheme: { primary: "var(--danger)", secondary: "var(--surface)" } },
        }}
      />
      <ThemeProvider>
        <ConfirmProvider>
          <App />
        </ConfirmProvider>
      </ThemeProvider>
    </ReactQueryProvider>
  </Provider>
);
