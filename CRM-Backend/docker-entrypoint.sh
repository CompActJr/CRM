#!/bin/sh
set -e

# O pooler em modo transaction (porta 6543) pode ficar indisponível; a porta 5432
# (session pooler) usa a mesma credencial e atende a API sem prepared statements.
if [ -n "$DIRECT_URL" ] && [ "$DATABASE_URL" != "$DIRECT_URL" ]; then
  case "$DATABASE_URL" in
    *:6543/*)
      echo "AVISO: DATABASE_URL usa o pooler na porta 6543; usando DIRECT_URL (porta 5432)."
      DATABASE_URL="$DIRECT_URL"
      export DATABASE_URL
      ;;
  esac
fi

echo "Aplicando migrations..."
npx prisma migrate deploy

echo "Verificando seed inicial..."
node prisma/ensureSeed.js

echo "Iniciando API..."
exec npm start
