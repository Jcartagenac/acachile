#!/bin/bash
# Este script descarga todas las imágenes del bucket R2
# Ejecutar después de configurar wrangler en la cuenta actual
wrangler r2 object get aca-chile-images --file=./
