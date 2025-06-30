#!/bin/bash

echo "🔄 Reiniciando ChromaDB com versão mais recente..."

# Parar containers existentes
docker-compose down

# Remover volume para limpar dados antigos (opcional)
read -p "Deseja limpar os dados existentes? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🗑️ Removendo dados antigos..."
    docker volume rm data-intake_chromadb_data 2>/dev/null || true
fi

# Iniciar com versão mais recente
echo "🚀 Iniciando ChromaDB..."
docker-compose up -d

echo "⏳ Aguardando ChromaDB inicializar..."
sleep 15

# Verificar se está funcionando
echo "🔍 Verificando status do ChromaDB..."
for i in {1..5}; do
    if curl -f http://localhost:8000/api/v1/heartbeat >/dev/null 2>&1; then
        echo "✅ ChromaDB está funcionando corretamente!"
        
        # Verificar versão
        echo "📋 Informações do ChromaDB:"
        curl -s http://localhost:8000/api/v1/heartbeat | jq . 2>/dev/null || curl -s http://localhost:8000/api/v1/heartbeat
        
        exit 0
    else
        echo "⏳ Tentativa $i/5 - Aguardando..."
        sleep 5
    fi
done

echo "❌ ChromaDB não está respondendo. Verifique os logs:"
docker-compose logs chromadb

echo "💡 Dicas para resolver problemas:"
echo "1. Verifique se a porta 8000 está livre: lsof -i :8000"
echo "2. Verifique os logs: docker-compose logs chromadb"
echo "3. Tente reiniciar: docker-compose restart chromadb" 