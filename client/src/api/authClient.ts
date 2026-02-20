import axios from 'axios';
// import { router } from '../router'
const authClient = axios.create({
  baseURL: '/auth', // 全てのリクエストの先頭に付与
  withCredentials: true, // Cookieを自動で送受信する設定（超重要！）
  headers: {
    'Content-Type': 'application/json',
  },
});

// レスポンスに対する共通処理（インターセプター）
authClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const currentPath = window.location.pathname;
    if (error.response?.status === 401 && currentPath !== '/login') {
    //   router.navigate({ to: '/login' });
    }
    return Promise.reject(error);
  }
);

export default authClient;