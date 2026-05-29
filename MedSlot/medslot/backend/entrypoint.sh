#!/bin/bash
# MedSlot backend entrypoint.
# Responsibilities:
#   1. Wait for PostgreSQL to accept connections (avoids startup race with db service).
#   2. Run Django migrations before the application process starts.
#   3. Exec the CMD so the application becomes PID 1 and receives signals correctly.
set -e

echo "Waiting for PostgreSQL..."
until python -c "
import os, sys
try:
    import psycopg2
    conn = psycopg2.connect(os.environ.get('DATABASE_URL', ''))
    conn.close()
    sys.exit(0)
except Exception:
    sys.exit(1)
" 2>/dev/null; do
  sleep 1
done
echo "PostgreSQL is ready."

echo "Running migrations..."
python manage.py migrate --noinput

echo "Starting application: $*"
exec "$@"
