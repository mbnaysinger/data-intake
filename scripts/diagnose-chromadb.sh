#!/bin/bash

echo "🔍 Diagnóstico do ChromaDB"
echo "=========================="

CHROMA_URL="http://localhost:8000"

# Verificar se o ChromaDB está rodando
echo "1. Verificando se o ChromaDB está rodando..."
if curl -f "$CHROMA_URL/api/v1/heartbeat" >/dev/null 2>&1; then
    echo "✅ ChromaDB está rodando"
else
    echo "❌ ChromaDB não está respondendo"
    echo "💡 Execute: docker-compose up -d"
    exit 1
fi

# Verificar informações da API
echo -e "\n2. Informações da API:"
echo "Heartbeat:"
curl -s "$CHROMA_URL/api/v1/heartbeat" | jq . 2>/dev/null || curl -s "$CHROMA_URL/api/v1/heartbeat"

# Verificar coleções existentes
echo -e "\n3. Coleções existentes:"
curl -s "$CHROMA_URL/api/v1/collections" | jq . 2>/dev/null || curl -s "$CHROMA_URL/api/v1/collections"

# Testar criação de coleção
echo -e "\n4. Testando diferentes versões da API..."
TEST_COLLECTION="test_collection_$(date +%s)"
echo "Criando coleção: $TEST_COLLECTION"

# Testar API v2 primeiro (mais recente)
echo -e "\nTestando API v2:"
CREATE_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$CHROMA_URL/api/v2/tenants/default_tenant/databases/default_database/collections" \
  -H "Content-Type: application/json" \
  -d "{\"name\": \"$TEST_COLLECTION\", \"metadata\": {\"hnsw:space\": \"cosine\"}}")

HTTP_CODE=$(echo "$CREATE_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$CREATE_RESPONSE" | head -n -1)

echo "API v2 - Status: $HTTP_CODE"
echo "API v2 - Resposta: $RESPONSE_BODY"

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
    echo "✅ API v2 funcionou!"
    API_VERSION="v2"
    WORKING_CREATE_ENDPOINT="api/v2/tenants/default_tenant/databases/default_database/collections"
else
    echo "❌ API v2 falhou, testando API v1..."
    
    # Testar API v1
    CREATE_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$CHROMA_URL/api/v1/collections" \
      -H "Content-Type: application/json" \
      -d "{\"name\": \"$TEST_COLLECTION\", \"metadata\": {\"hnsw:space\": \"cosine\"}}")
    
    HTTP_CODE=$(echo "$CREATE_RESPONSE" | tail -n1)
    RESPONSE_BODY=$(echo "$CREATE_RESPONSE" | head -n -1)
    
    echo "API v1 - Status: $HTTP_CODE"
    echo "API v1 - Resposta: $RESPONSE_BODY"
    
    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
        echo "✅ API v1 funcionou!"
        API_VERSION="v1"
        WORKING_CREATE_ENDPOINT="api/v1/collections"
    else
        echo "❌ Ambas as APIs falharam"
        API_VERSION="unknown"
    fi
fi

# Testar adição de documento
if [ "$API_VERSION" = "v2" ]; then
    echo -e "\n5. Testando endpoints da API v2..."
    endpoints=("upsert" "add")
    
    for endpoint in "${endpoints[@]}"; do
        echo -e "\nTestando endpoint v2: $endpoint"
        
        ADD_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$CHROMA_URL/api/v2/tenants/default_tenant/databases/default_database/collections/$TEST_COLLECTION/$endpoint" \
          -H "Content-Type: application/json" \
          -d '{
            "ids": ["test1"],
            "documents": ["test document"],
            "metadatas": [{"id": "test1", "source": "test"}],
            "embeddings": [[0.1, 0.2, 0.3]]
          }')
        
        HTTP_CODE=$(echo "$ADD_RESPONSE" | tail -n1)
        RESPONSE_BODY=$(echo "$ADD_RESPONSE" | head -n -1)
        
        echo "Status: $HTTP_CODE"
        echo "Resposta: $RESPONSE_BODY"
        
        if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
            echo "✅ Endpoint v2 $endpoint funcionou!"
            WORKING_ENDPOINT=$endpoint
            break
        else
            echo "❌ Endpoint v2 $endpoint falhou"
        fi
    done
elif [ "$API_VERSION" = "v1" ]; then
    echo -e "\n5. Testando endpoints da API v1..."
    endpoints=("upsert" "add" "insert")
    
    for endpoint in "${endpoints[@]}"; do
        echo -e "\nTestando endpoint v1: $endpoint"
        
        ADD_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$CHROMA_URL/api/v1/collections/$TEST_COLLECTION/$endpoint" \
          -H "Content-Type: application/json" \
          -d '{
            "documents": ["test document"],
            "metadatas": [{"id": "test1", "source": "test"}],
            "embeddings": [[0.1, 0.2, 0.3]]
          }')
        
        HTTP_CODE=$(echo "$ADD_RESPONSE" | tail -n1)
        RESPONSE_BODY=$(echo "$ADD_RESPONSE" | head -n -1)
        
        echo "Status: $HTTP_CODE"
        echo "Resposta: $RESPONSE_BODY"
        
        if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
            echo "✅ Endpoint v1 $endpoint funcionou!"
            WORKING_ENDPOINT=$endpoint
            break
        else
            echo "❌ Endpoint v1 $endpoint falhou"
        fi
    done
else
    echo -e "\n5. API não detectada, pulando testes de adição"
fi

if [ -n "$WORKING_ENDPOINT" ]; then
    echo -e "\n🎯 Endpoint funcional encontrado: $WORKING_ENDPOINT"
else
    echo -e "\n❌ Nenhum endpoint funcionou"
fi

# Limpar coleção de teste
echo -e "\n6. Limpando coleção de teste..."
curl -s -X DELETE "$CHROMA_URL/api/v1/collections/$TEST_COLLECTION" >/dev/null
echo "✅ Coleção de teste removida"

# Verificar logs do container
echo -e "\n7. Últimos logs do ChromaDB:"
docker-compose logs --tail=20 chromadb

echo -e "\n🎯 Diagnóstico concluído!" 