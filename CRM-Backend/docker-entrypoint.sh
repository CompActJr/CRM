#!/bin/sh
set -e

# A URL direta é usada apenas para sincronizar o schema e verificar o seed.
# A API mantém DATABASE_URL para usar o pooler de runtime, que multiplexa conexões.
runtimeDatabaseUrl="$DATABASE_URL"

if [ -n "$DIRECT_URL" ] && [ "$DATABASE_URL" != "$DIRECT_URL" ]; then
  case "$DATABASE_URL" in
    *:6543/*)
      echo "AVISO: DATABASE_URL usa o pooler na porta 6543; usando DIRECT_URL (porta 5432)."
      DATABASE_URL="$DIRECT_URL"
      export DATABASE_URL
      ;;
  esac
fi

echo "Sincronizando banco de dados..."
npx prisma db push --skip-generate

echo "Verificando seed inicial..."
node prisma/ensureSeed.js

DATABASE_URL="$runtimeDatabaseUrl"
export DATABASE_URL

echo "Iniciando API..."
exec npm start
