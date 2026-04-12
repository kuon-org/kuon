import { createHttpClient } from "./createHttpClient";

const authClient = createHttpClient({
  baseURL: "/auth",
  credentials: "include",
});

export default authClient;
