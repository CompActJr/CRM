FROM node:20-alpine

# O CRM opera em horário de Brasília; sem TZ o container assume UTC e todo
# cálculo com data local (relatórios, prazos, PDF) sai 3h deslocado.
ENV TZ=America/Sao_Paulo

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY . .

EXPOSE 3333

CMD ["sh", "docker-entrypoint.sh"]
