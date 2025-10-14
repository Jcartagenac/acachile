#!/bin/bash

# Script para iniciar tanto frontend como worker en background
echo "🚀 Iniciando ACA Chile - Desarrollo"

# Verificar que estemos en el directorio correcto
if [ ! -f "package.json" ]; then
  echo "❌ Error: Ejecuta este script desde la raíz del proyecto"
  exit 1
fi

# Matar procesos existentes
echo "🔄 Limpiando procesos anteriores..."
pkill -f "vite" || true
pkill -f "wrangler" || true
sleep 2

# Función para iniciar el worker
start_worker() {
  echo "🔧 Iniciando Worker (puerto 8787)..."
  cd worker
  nohup npm run dev > ../worker.log 2>&1 &
  WORKER_PID=$!
  echo $WORKER_PID > ../worker.pid
  cd ..
  echo "Worker PID: $WORKER_PID"
}

# Función para iniciar el frontend
start_frontend() {
  echo "💻 Iniciando Frontend (puerto 5174)..."
  cd frontend
  nohup npm run dev > ../frontend.log 2>&1 &
  FRONTEND_PID=$!
  echo $FRONTEND_PID > ../frontend.pid
  cd ..
  echo "Frontend PID: $FRONTEND_PID"
}

# Iniciar servicios
start_worker
sleep 3
start_frontend
sleep 3

echo ""
echo "✅ Servicios iniciados:"
echo "   🔧 Worker:    http://localhost:8787"
echo "   💻 Frontend:  http://localhost:5174"
echo ""
echo "📋 Para ver los logs:"
echo "   tail -f worker.log"
echo "   tail -f frontend.log"
echo ""
echo "🛑 Para detener los servicios:"
echo "   ./stop-dev.sh"
echo ""

# Verificar que los servicios estén corriendo
sleep 5
echo "🔍 Verificando servicios..."

if curl -s http://localhost:8787/api/health > /dev/null; then
  echo "✅ Worker: OK"
else
  echo "❌ Worker: No responde"
fi

if curl -s http://localhost:5174 > /dev/null; then
  echo "✅ Frontend: OK"
else
  echo "❌ Frontend: No responde"
fi

echo ""
echo "🎉 ¡Desarrollo listo! Abre http://localhost:5174 en tu navegador"