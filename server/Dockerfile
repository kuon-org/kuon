# Node.js 公式イメージ
FROM node:20-alpine

WORKDIR /app

# package.json と package-lock.json をコピーして依存関係インストール
COPY package*.json ./
RUN npm install

# server のソースとビルド済み React をコピー
COPY . .

# 3000番ポートを公開
EXPOSE 3000

# コンテナ起動時に Express サーバーを起動
CMD ["npm", "run", "dev"]