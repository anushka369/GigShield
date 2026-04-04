#!/bin/bash
set -e

echo "=== AegiSync backend startup ==="

echo "[1/3] Creating database tables (with retry)..."
python - <<'PYEOF'
import sys, time
sys.path.insert(0, '/app')

for attempt in range(30):
    try:
        from database import engine, Base
        import models  # registers all ORM models with Base
        Base.metadata.create_all(bind=engine)
        print(f"  Tables created / verified (attempt {attempt + 1}).")
        break
    except Exception as e:
        print(f"  DB not ready (attempt {attempt + 1}/30): {e}")
        time.sleep(2)
else:
    print("  ERROR: Database unreachable after 30 attempts.")
    sys.exit(1)
PYEOF

echo "[2/3] Checking if seed is needed..."
WORKER_COUNT=$(python - <<'PYEOF'
import sys
sys.path.insert(0, '/app')
from database import SessionLocal
from models import Worker
db = SessionLocal()
try:
    print(db.query(Worker).count())
finally:
    db.close()
PYEOF
)

if [ "$WORKER_COUNT" = "0" ]; then
    echo "  Database empty — running seed.py..."
    python seed.py
else
    echo "  Database already has $WORKER_COUNT workers — skipping seed."
fi

echo "[3/3] Starting uvicorn..."
exec uvicorn main:app --host 0.0.0.0 --port 8000 --workers 1
