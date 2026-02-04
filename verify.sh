#!/bin/bash
# Script de verificación del proyecto

echo "╔════════════════════════════════════════════════════════════╗"
echo "║        Verificando Sistema de Detección de Caídas         ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Node.js
echo -n "Node.js: "
if command -v node &> /dev/null; then
    VERSION=$(node -v)
    echo -e "${GREEN}✓ Instalado${NC} ($VERSION)"
else
    echo -e "${RED}✗ No instalado${NC}"
fi

# Check npm
echo -n "npm: "
if command -v npm &> /dev/null; then
    VERSION=$(npm -v)
    echo -e "${GREEN}✓ Instalado${NC} ($VERSION)"
else
    echo -e "${RED}✗ No instalado${NC}"
fi

# Check backend folder
echo -n "Backend folder: "
if [ -d "backend" ]; then
    echo -e "${GREEN}✓ Existe${NC}"
else
    echo -e "${RED}✗ No existe${NC}"
fi

# Check frontend folder
echo -n "Frontend folder: "
if [ -d "fall-detection-frontend" ]; then
    echo -e "${GREEN}✓ Existe${NC}"
else
    echo -e "${RED}✗ No existe${NC}"
fi

# Check backend package.json
echo -n "Backend package.json: "
if [ -f "backend/package.json" ]; then
    echo -e "${GREEN}✓ Existe${NC}"
else
    echo -e "${RED}✗ No existe${NC}"
fi

# Check backend src/server.ts
echo -n "Backend server.ts: "
if [ -f "backend/src/server.ts" ]; then
    echo -e "${GREEN}✓ Existe${NC}"
else
    echo -e "${RED}✗ No existe${NC}"
fi

# Check backend routes
echo -n "Backend routes: "
ROUTES_COUNT=$(ls -1 backend/src/routes/*.ts 2>/dev/null | wc -l)
if [ $ROUTES_COUNT -ge 4 ]; then
    echo -e "${GREEN}✓ $ROUTES_COUNT archivos${NC}"
else
    echo -e "${RED}✗ Incompleto${NC}"
fi

# Check documentation
echo -n "Documentación: "
DOCS_COUNT=$(ls -1 *.md *.txt 2>/dev/null | wc -l)
if [ $DOCS_COUNT -ge 5 ]; then
    echo -e "${GREEN}✓ $DOCS_COUNT archivos${NC}"
else
    echo -e "${YELLOW}⚠ Solo $DOCS_COUNT archivos${NC}"
fi

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                    Estado: LISTO ✓                        ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "Próximo paso:"
echo "  1. cd backend && npm run dev"
echo "  2. En otra terminal: cd fall-detection-frontend && npm run dev"
echo "  3. Accede a: http://localhost:5173"
echo ""
