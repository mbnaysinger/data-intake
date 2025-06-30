# Módulo de Extração e Chunking

Este módulo fornece funcionalidades para extrair conteúdo de documentos, fazer chunking e armazenar embeddings em um vector store.

## Funcionalidades

- **Extração de Documentos**: Suporte para PDF, Excel, texto e HTML
- **Chunking Inteligente**: Múltiplas estratégias de divisão de documentos
- **Embeddings**: Geração de embeddings usando OpenAI
- **Vector Store**: Armazenamento em ChromaDB para busca semântica
- **Upload de Arquivos**: Endpoint para upload direto de arquivos via FormData

## Endpoints

### 1. Upload e Extração de Arquivo

**POST** `/api/v1/extraction/upload`

Endpoint para upload de arquivos usando FormData. Captura automaticamente todas as informações necessárias.

#### Parâmetros (FormData)

| Campo | Tipo | Obrigatório | Descrição | Exemplo |
|-------|------|-------------|-----------|---------|
| `file` | File | ✅ | Arquivo para extração | `documento.pdf` |
| `author` | String | ❌ | Autor do documento | `João Silva` |
| `category` | String | ❌ | Categoria do documento | `financeiro` |
| `department` | String | ❌ | Departamento responsável | `TI` |
| `tags` | String | ❌ | Tags (separadas por vírgula) | `importante,urgente,2024` |
| `chunkingStrategy` | String | ❌ | Estratégia de chunking | `recursive` |
| `chunkSize` | Number | ❌ | Tamanho do chunk | `1000` |
| `chunkOverlap` | Number | ❌ | Sobreposição entre chunks | `200` |
| `saveToVectorStore` | Boolean | ❌ | Salvar no vector store | `true` |
| `additionalMetadata` | String | ❌ | Metadados adicionais (JSON) | `{"priority": "high"}` |

#### Exemplo de Uso

```bash
curl -X POST http://localhost:3000/api/v1/extraction/upload \
  -F "file=@documento.pdf" \
  -F "author=João Silva" \
  -F "category=financeiro" \
  -F "department=TI" \
  -F "tags=importante,urgente,2024" \
  -F "chunkingStrategy=recursive" \
  -F "chunkSize=1000" \
  -F "chunkOverlap=200" \
  -F "saveToVectorStore=true" \
  -F "additionalMetadata={\"priority\": \"high\", \"reviewed\": true}"
```

#### Exemplo com JavaScript

```javascript
const FormData = require('form-data');
const fs = require('fs');
const axios = require('axios');

const formData = new FormData();
formData.append('file', fs.createReadStream('documento.pdf'), 'documento.pdf');
formData.append('author', 'João Silva');
formData.append('category', 'financeiro');
formData.append('tags', 'importante,urgente,2024');

const response = await axios.post('http://localhost:3000/api/v1/extraction/upload', formData, {
  headers: {
    ...formData.getHeaders(),
  },
});

console.log(response.data);
```

### 2. Extração Manual

**POST** `/api/v1/extraction`

Endpoint para extração manual especificando todos os parâmetros.

#### Request Body

```json
{
  "source": "/path/to/document.pdf",
  "fileType": "pdf",
  "chunkingStrategy": "recursive",
  "chunkSize": 1000,
  "chunkOverlap": 200,
  "metadata": {
    "author": "João Silva",
    "category": "financeiro"
  },
  "saveToVectorStore": true
}
```

### 3. Busca Semântica

**POST** `/api/v1/extraction/search`

Busca documentos similares no vector store.

#### Request Body

```json
{
  "query": "relatório financeiro",
  "k": 5,
  "filter": {
    "category": "financeiro"
  }
}
```

### 4. Listagem de Extrações

**GET** `/api/v1/extraction`

Lista todas as extrações com paginação.

#### Query Parameters

- `limit`: Número máximo de itens (padrão: 10)
- `offset`: Número de itens para pular (padrão: 0)

### 5. Detalhes de Extração

**GET** `/api/v1/extraction/:id`

Retorna detalhes de uma extração específica.

### 6. Health Check

**GET** `/api/v1/extraction/health`

Verifica se o serviço está funcionando.

## Estratégias de Chunking

### 1. Recursive (Padrão)
- Divide o documento de forma hierárquica
- Mantém a estrutura semântica
- Ideal para documentos longos e estruturados

### 2. Token
- Divide baseado em tokens
- Útil para processamento de linguagem natural
- Controle preciso sobre o tamanho dos chunks

### 3. Character
- Divide baseado em caracteres
- Simples e rápido
- Ideal para documentos simples

## Tipos de Arquivo Suportados

- **PDF** (`.pdf`)
- **Excel** (`.xlsx`, `.xls`)
- **Texto** (`.txt`)
- **HTML** (`.html`, `.htm`)

## Configuração

### Variáveis de Ambiente

#### Para Azure OpenAI (Recomendado)
```env
# Azure OpenAI
AZURE_OPENAI_API_KEY=sua_chave_api_azure_aqui
AZURE_OPENAI_ENDPOINT=https://openai-ginfo-dev-froundry.openai.azure.com
AZURE_OPENAI_API_DEPLOYMENT_NAME=nome_do_seu_deployment
AZURE_OPENAI_API_VERSION=2024-02-15-preview
```

#### Para OpenAI (Alternativo)
```env
# OpenAI
OPENAI_API_KEY=sua_chave_api_openai_aqui
OPENAI_MODEL=gpt-3.5-turbo
```

#### Configurações Gerais
```env
# ChromaDB
CHROMA_HOST=localhost
CHROMA_PORT=8000
CHROMA_COLLECTION=documents

# Configurações de Chunking
DEFAULT_CHUNK_SIZE=1000
DEFAULT_CHUNK_OVERLAP=200
DEFAULT_CHUNKING_STRATEGY=recursive
```

### Docker Compose

```yaml
version: '3.8'
services:
  chromadb:
    image: chromadb/chroma:latest
    ports:
      - "8000:8000"
    volumes:
      - chroma_data:/chroma/chroma
    environment:
      - CHROMA_SERVER_HOST=0.0.0.0
      - CHROMA_SERVER_HTTP_PORT=8000

volumes:
  chroma_data:
```

## Exemplos de Uso

### Script de Exemplo

Execute o script de exemplo para testar o upload:

```bash
npm run tsx scripts/upload-example.ts
```

### Testes

```bash
# Testes unitários
npm run test

# Testes e2e
npm run test:e2e
```

## Estrutura do Projeto

```
src/modules/extraction/
├── api/v1/
│   ├── dto/
│   │   ├── extraction-request.dto.ts
│   │   ├── extraction-response.dto.ts
│   │   └── upload-extraction.dto.ts
│   └── rest/
│       └── extraction.controller.ts
├── domain/
│   ├── model/
│   │   └── document-chunk.model.ts
│   └── service/
│       ├── chunking.service.ts
│       ├── document-loader.service.ts
│       ├── embedding.service.ts
│       ├── extraction.service.ts
│       ├── file-upload.service.ts
│       └── vector-store.service.ts
└── extraction.module.ts
```

## Logs e Monitoramento

O módulo utiliza o sistema de logging configurado no projeto. Logs importantes incluem:

- Upload de arquivos
- Processamento de extração
- Geração de embeddings
- Operações no vector store
- Erros e exceções

## Limitações

- Tamanho máximo de arquivo: 50MB
- Tipos de arquivo limitados aos suportados
- Dependência da API da OpenAI para embeddings
- Requer ChromaDB rodando para vector store

## Troubleshooting

### Erro de Upload
- Verifique se o arquivo não está vazio
- Confirme se o tipo de arquivo é suportado
- Verifique se o tamanho não excede 50MB

### Erro de Extração
- Verifique as configurações da OpenAI
- Confirme se o ChromaDB está rodando
- Verifique os logs para detalhes do erro

### Erro de Vector Store
- Confirme se o ChromaDB está acessível
- Verifique as configurações de conexão
- Confirme se a coleção existe 