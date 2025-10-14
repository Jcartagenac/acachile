#!/bin/bash

# Script para detener los servicios de desarrollo
echo "🛑 Deteniendo servicios ACA Chile..."

# Leer PIDs y matar procesos
if [ -f "worker.pid" ]; then
  WORKER_PID=$(cat worker.pid)
  if kill -0 $WORKER_PID 2>/dev/null; then
    kill $WORKER_PID
    echo "🔧 Worker detenido (PID: $WORKER_PID)"
  fi
  rm worker.pid
fi

if [ -f "frontend.pid" ]; then
  FRONTEND_PID=$(cat frontend.pid)
  if kill -0 $FRONTEND_PID 2>/dev/null; then
    kill $FRONTEND_PID
    echo "💻 Frontend detenido (PID: $FRONTEND_PID)"
  fi
  rm frontend.pid
fi

# Limpieza adicional por si acaso
pkill -f "vite" || true
pkill -f "wrangler" || true

echo "✅ Todos los servicios detenidos"