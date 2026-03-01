FROM node:20
WORKDIR /app

ENV TZ=Asia/Tokyo

# ===== 依存関係インストール =====
COPY app/package*.json ./
RUN npm install --omit=dev

# ===== Expressサーバファイルをコピー =====
COPY app/ .

# ===== Reactビルド成果物をコピー =====
COPY dist ../dist

# ===== Prismaクライアント生成（必要に応じて） =====
RUN npx prisma generate || true

EXPOSE 9040
CMD ["node", "index.js"]