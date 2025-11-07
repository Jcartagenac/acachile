#!/bin/bash

echo "=================================================="
echo "MIGRACIÓN AUTOMÁTICA DE IMÁGENES R2"
echo "=================================================="

# Crear directorio temporal
mkdir -p temp-r2-images

echo ""
echo "PASO 1: Hacer login en cuenta ANTIGUA"
echo "=================================================="
wrangler logout
echo ""
echo "⚠️  Cuando se abra el navegador, selecciona: juecart@gmail.com"
read -p "Presiona Enter cuando hayas hecho login en la cuenta antigua..."
wrangler login

echo ""
echo "PASO 2: Listar y descargar imágenes de cuenta antigua"
echo "=================================================="

# Listar objetos
echo "Listando imágenes en bucket aca-chile-images..."
wrangler r2 object list aca-chile-images > temp-r2-images/list.txt 2>&1

# Verificar si el bucket tiene objetos
if grep -q "No objects found" temp-r2-images/list.txt || ! grep -q "key:" temp-r2-images/list.txt; then
    echo "✓ Encontradas 0 imágenes"
    TOTAL=0
else
    TOTAL=$(grep "key:" temp-r2-images/list.txt | wc -l | tr -d ' ')
    echo "✓ Encontradas $TOTAL imágenes"
fi

if [ "$TOTAL" -eq 0 ]; then
    echo "⚠️  No hay imágenes para migrar"
    exit 0
fi

# Descargar cada imagen
if [ "$TOTAL" -gt 0 ]; then
    echo ""
    echo "Descargando imágenes..."
    node -e "
const fs = require('fs');
const { execSync } = require('child_process');

// Leer el output de wrangler y extraer las keys
const listOutput = fs.readFileSync('temp-r2-images/list.txt', 'utf-8');
const lines = listOutput.split('\\n');
const keys = [];

for (const line of lines) {
    if (line.includes('key:')) {
        const key = line.split('key:')[1].trim();
        if (key) keys.push(key);
    }
}

console.log(\`Encontradas \${keys.length} imágenes para descargar\\n\`);

let count = 0;
for (const key of keys) {
    count++;
    const fileName = key.replace(/\\//g, '_');
    const filePath = \`temp-r2-images/\${fileName}\`;
    
    console.log(\`[\${count}/\${keys.length}] Descargando: \${key}\`);
    
    try {
        execSync(\`wrangler r2 object get aca-chile-images \${key} --file=\${filePath}\`, {
            stdio: 'pipe'
        });
        
        // Guardar metadata
        const metadata = {
            originalKey: key,
            fileName: fileName
        };
        fs.writeFileSync(\`\${filePath}.meta.json\`, JSON.stringify(metadata, null, 2));
        
        console.log(\`  ✓ Descargado\`);
    } catch (error) {
        console.error(\`  ✗ Error:\`, error.message);
    }
}

console.log(\`\\n✓ Descarga completada: \${count} imágenes\`);
"
fi

echo ""
echo "PASO 3: Hacer login en cuenta NUEVA"
echo "=================================================="
wrangler logout
echo ""
echo "⚠️  Cuando se abra el navegador, selecciona: webmaster@acachile.com"
read -p "Presiona Enter cuando hayas hecho login en la cuenta nueva..."
wrangler login

echo ""
echo "PASO 4: Subir imágenes a cuenta nueva"
echo "=================================================="

# Subir cada imagen
if [ "$TOTAL" -gt 0 ]; then
    node -e "
const fs = require('fs');
const { execSync } = require('child_process');

const files = fs.readdirSync('temp-r2-images').filter(f => f.endsWith('.meta.json'));

let count = 0;
let success = 0;
let errors = 0;

for (const metaFile of files) {
    count++;
    const metadata = JSON.parse(fs.readFileSync(\`temp-r2-images/\${metaFile}\`, 'utf-8'));
    const fileName = metadata.fileName;
    const originalKey = metadata.originalKey;
    const filePath = \`temp-r2-images/\${fileName}\`;
    
    console.log(\`[\${count}/\${files.length}] Subiendo: \${originalKey}\`);
    
    try {
        execSync(\`wrangler r2 object put aca-chile-images \${originalKey} --file=\${filePath}\`, {
            stdio: 'pipe'
        });
        console.log(\`  ✓ Subido correctamente\`);
        success++;
    } catch (error) {
        console.error(\`  ✗ Error:\`, error.message);
        errors++;
    }
}

console.log(\`\\n================================================\`);
console.log(\`MIGRACIÓN COMPLETADA\`);
console.log(\`================================================\`);
console.log(\`Total procesadas: \${count}\`);
console.log(\`✓ Exitosas: \${success}\`);
console.log(\`✗ Errores: \${errors}\`);
"
else
    echo "⚠️  No hay imágenes para subir"
fi

echo ""
echo "PASO 5: Limpiar archivos temporales"
echo "=================================================="
read -p "¿Deseas eliminar los archivos temporales? (s/n): " CLEAN

if [ "$CLEAN" = "s" ]; then
    rm -rf temp-r2-images
    echo "✓ Archivos temporales eliminados"
else
    echo "⚠️  Archivos temporales conservados en: temp-r2-images/"
fi

echo ""
echo "✅ ¡Migración de imágenes completada!"
