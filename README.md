# Data Intake - Serviço de Extração e Chunking

Este projeto implementa um serviço completo de extração e chunking de documentos usando NestJS, LangChain, OpenAI/Azure OpenAI e ChromaDB.

## 🚀 Funcionalidades

- **Extração de Documentos**: Suporte para PDF, Excel, Texto e HTML
- **Chunking Inteligente**: Múltiplas estratégias de divisão de texto
- **Geração de Embeddings**: Usando OpenAI ou Azure OpenAI
- **Vector Store**: Armazenamento e busca em ChromaDB
- **API REST**: Endpoints para extração, busca e gerenciamento

## 📋 Pré-requisitos

- Node.js 18+
- Docker e Docker Compose
- OpenAI API Key ou Azure OpenAI

## 🛠️ Instalação

1. **Clone o repositório**
```bash
git clone <repository-url>
cd data-intake
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**
```bash
cp env.example .env.local
# Edite o arquivo .env.local com suas configurações

# OU use o arquivo de configuração YAML (recomendado)
cp config.example.yml .env.yml
# Edite o arquivo .env.yml com suas configurações
```

4. **Inicie o ChromaDB**
```bash
docker-compose up -d chromadb
```

5. **Execute o projeto**
```bash
# Desenvolvimento
npm run start:dev

# Produção
npm run build
npm run start:prod
```

## 🔧 Configuração

### Variáveis de Ambiente

```bash
# Ambiente
NODE_ENV=local

# OpenAI/Azure OpenAI
OPENAI_API_KEY=your_openai_api_key
AZURE_OPENAI_API_KEY=your_azure_openai_api_key
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
AZURE_OPENAI_DEPLOYMENT_NAME=your-deployment-name

# ChromaDB
CHROMA_URL=http://localhost:8000
CHROMA_COLLECTION_NAME=documents

# Logging
LOG_LEVEL=info
```

### Configuração YAML (Recomendado)

Para melhor organização, você pode usar o arquivo `.env.yml`:

```yaml
# Configurações da aplicação
server:
  port: 3000
  node_env: local

# Configurações do OpenAI
openai:
  api_key: your_openai_api_key

# Configurações do Azure OpenAI
azure_openai:
  api_key: your_azure_openai_api_key
  endpoint: https://your-resource.openai.azure.com
  deployment_name: your-deployment-name

# Configurações do ChromaDB
chromadb:
  url: http://localhost:8000
  collection_name: documents

# Configurações de logging
logging:
  level: info
```

## 📚 Uso da API

### Extrair Documento
```bash
POST /api/v1/extraction
```

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

### Buscar Documentos Similares
```bash
POST /api/v1/extraction/search
```

```json
{
  "query": "Como funciona o processo de aprovação?",
  "k": 5,
  "filter": {
    "fileType": "pdf"
  }
}
```

### Listar Extrações
```bash
GET /api/v1/extraction?limit=10&offset=0
```

### Obter Extração Específica
```bash
GET /api/v1/extraction/{id}
```

## 🔄 Fluxo de Processamento

1. **Carregamento**: Documento é carregado usando LangChain loaders
2. **Chunking**: Texto é dividido em chunks menores
3. **Embeddings**: Cada chunk recebe um embedding vetorial
4. **Armazenamento**: Chunks são salvos no ChromaDB (opcional)
5. **Resposta**: API retorna chunks com metadados e embeddings

## 📊 Estratégias de Chunking

1. **Recursive**: Divide o texto de forma recursiva usando separadores
2. **Token**: Divide baseado em tokens (recomendado para LLMs)
3. **Character**: Divide baseado em caracteres

## 📄 Tipos de Arquivo Suportados

- **PDF**: Usando pdf-parse
- **Excel**: Usando xlsx (todas as planilhas)
- **Texto**: Arquivos .txt
- **HTML**: Arquivos .html (extração básica de texto)

## 🐳 Docker

### ChromaDB
```bash
# Iniciar ChromaDB
docker-compose up -d chromadb

# Verificar status
docker-compose ps

# Logs
docker-compose logs chromadb
```

## 📈 Monitoramento

O projeto inclui logs detalhados para:
- Carregamento de documentos
- Processo de chunking
- Geração de embeddings
- Operações do vector store
- Tempo de processamento

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 🆘 Suporte

Para suporte, abra uma issue no repositório ou entre em contato com a equipe de desenvolvimento.

## 🧪 Testes

```bash
# Testes unitários
npm run test:unit

# Testes do módulo de extração
npm run extraction:test

# Testes e2e
npm run test:e2e

# Cobertura de testes
npm run test:cov
```

## 📖 Exemplos

### Executar Exemplo de Extração
```bash
npm run extraction:example
```

Este comando executa um script de exemplo que demonstra:
- Extração de documentos PDF e Excel
- Busca semântica no vector store
- Filtros e metadados
- Estatísticas da coleção

## 🏗️ Arquitetura

```
src/
├── modules/
│   ├── config/           # Configurações da aplicação
│   ├── health/           # Health checks
│   ├── extraction/       # Módulo de extração
│   └── common/           # Filtros e utilitários
└── main.ts              # Ponto de entrada da aplicação
```