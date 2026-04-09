import axios from "axios";
import { queryClient } from "../utils/queryClient";
// import { router } from '../router'
const apiClient = axios.create({
  baseURL: "/api", // 全てのリクエストの先頭に付与
  withCredentials: true, // Cookieを自動で送受信する設定（超重要！）
  headers: {
    "Content-Type": "application/json",
  },
});

// レスポンスに対する共通処理（インターセプター）
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const currentPath = window.location.pathname;
    if (error.response?.status === 401 && currentPath !== "/login") {
      queryClient.setQueryData(["authUser"], null);
    }
    return Promise.reject(error);
  },
);

export default apiClient;
