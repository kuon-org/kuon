import React from 'react'
import ReactDOM from 'react-dom/client'
import { AppRouter } from './router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeSelectProvider } from './hooks/useTheme';
import {themes} from './styles/themes'
import { CssBaseline } from '@mui/material';
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // API の性質に合わせて調整
      staleTime: 1000 * 30,       // 30秒は新鮮扱い
      gcTime: 1000 * 60 * 10,     // 10分でメモリから破棄
      retry: 1,                   // 失敗時の自動リトライ回数
      refetchOnWindowFocus: false // フォーカスで再取得を抑止（必要なら true）
    }
  }
});


ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      
      <ThemeSelectProvider themes={themes}>
        <CssBaseline />
        <AppRouter />
      </ThemeSelectProvider>
    </QueryClientProvider>
  </React.StrictMode>,
)