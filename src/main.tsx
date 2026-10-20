import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import AIEntry from "./AIEntry";
import RAGEntry from "./RAGEntry";
import "./styles.css";
createRoot(document.getElementById("root")!).render(<StrictMode><App />{import.meta.env.DEV && !("__TAURI_INTERNALS__" in window) && <><AIEntry /><RAGEntry /></>}</StrictMode>);
