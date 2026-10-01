import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { getRouter } from "./router";
import "./styles.css";

const redirect = new URLSearchParams(window.location.search).get("gh");
if (redirect) {
  window.history.replaceState(
    null,
    "",
    `${import.meta.env.BASE_URL.replace(/\/$/, "")}${redirect}`,
  );
}

const router = getRouter();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);