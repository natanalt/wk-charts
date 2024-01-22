import React from "react";
import ReactDOM from "react-dom/client";
import App from "./ui/App";
import "./main.css"

ReactDOM.createRoot(document.getElementById("app-area")!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
