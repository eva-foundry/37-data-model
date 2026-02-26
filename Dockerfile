FROM python:3.12-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy model layer files (seed source — baked into image)
COPY model/ ./model/

# Copy API code
COPY api/ ./api/

# Non-root user
RUN useradd -m -u 1001 appuser && chown -R appuser /app
USER appuser

EXPOSE 8010

# IMPORTANT: keep workers=1 while running MemoryStore (per-process state → split-brain).
# Increase to 2+ only after COSMOS_URL + COSMOS_KEY are provisioned in the environment.
#
# Probe split:
#   /health  = liveness  (process alive, no Cosmos round-trip)  → fast, cheap
#   /ready   = readiness (Cosmos ping included)                  → use for k8s readinessProbe
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD python -c "import urllib.request,sys; r=urllib.request.urlopen('http://localhost:8010/ready',timeout=8); sys.exit(0 if r.status==200 else 1)"

CMD ["uvicorn", "api.server:app", "--host", "0.0.0.0", "--port", "8010", "--workers", "1"]
