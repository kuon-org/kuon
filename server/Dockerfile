FROM node:20
WORKDIR /app

ENV TZ=Asia/Tokyo

# ===== 依存関係インストール =====
COPY app/package*.json ./
RUN npm install --omit=dev

# ===== ファイルをコピー =====
COPY app/ .
COPY dist ../dist
COPY ./prisma ./prisma

# ===== Prismaクライアント生成 =====
RUN npx prisma generate --schema=./prisma/schema.prisma

EXPOSE 9040
CMD ["node", "index.js"]