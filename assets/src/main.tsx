import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import Layout from "src/components/layout/Layout";
import NotFound from "src/pages/NotFound";
import Requests from "src/pages/Requests";
import "src/assets/index.css";
import Logs from "src/pages/Logs";
import Scripts from "src/pages/Scripts";
import NotImplemented from "src/pages/NotImplemented";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/requests" replace />} />
          <Route path="/requests" element={<Requests />} />
					<Route path="/logs" element={<Logs/>}/>
					<Route path="/scripts" element={<Scripts/>}/>
					<Route path="/documentation" element={<NotImplemented/>}/>
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
