// API base URL configuration
export const API_URL =
  import.meta.env.MODE === "production"
    ? "https://api.trayalife.com/api"
    : "http://localhost:4000/api";
