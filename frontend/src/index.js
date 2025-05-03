import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App";
import ViewLayout from "./ViewLayout";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />} />                 {/* builder */}
      <Route path="/view/:layoutName" element={<ViewLayout />} /> {/* viewer */}
    </Routes>
  </BrowserRouter>
);
