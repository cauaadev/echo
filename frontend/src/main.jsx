// javascript
// Polyfill para libs que esperam "global" no browser (ex.: sockjs-client)
if (typeof window !== "undefined" && typeof window.global === "undefined") {
    window.global = window;
}

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <BrowserRouter>
            <App />
        </BrowserRouter>
    </React.StrictMode>
);