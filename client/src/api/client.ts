import { createHttpClient } from "./createHttpClient";

const apiClient = createHttpClient({
  baseURL: "/api",
  credentials: "include",
});

export default apiClient;
