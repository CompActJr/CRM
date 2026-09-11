#!/bin/sh
set -e

echo "Sincronizando banco de dados (prisma db push)..."
npx prisma db push --accept-data-loss

echo "Verificando seed inicial..."
node prisma/ensureSeed.js

echo "Iniciando API..."
exec npm start
