FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY . .

ENV PORT=3333

EXPOSE 3333

1CMD ["sh", "-c", "npx prisma db push && node prisma/ensureSeed.js && exec npm start"]