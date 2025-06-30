# Data Intake

## Visão Geral

O **data-intake** é um serviço backend desenvolvido em Node.js com NestJS, projetado para realizar a extração, chunking, vetorização e armazenamento de documentos em um vector store (ChromaDB), utilizando Azure OpenAI para embeddings e LangChain para abstração de operações de IA. O objetivo é transformar documentos em chunks semânticos, gerar embeddings vetoriais e armazená-los para buscas semânticas rápidas e eficientes.

---

## Proposta do Projeto

- **Automatizar o intake de documentos** (PDF, TXT, HTML, Excel) para sistemas de IA e busca semântica.
- **Chunking inteligente**: dividir documentos em partes menores (chunks) usando estratégias configuráveis.
- **Vetorização**: gerar embeddings vetoriais de cada chunk usando Azure OpenAI.
- **Armazenamento vetorial**: persistir os chunks e embeddings no ChromaDB, permitindo buscas semânticas rápidas.
- **API RESTful**: expor endpoints para upload, extração, busca e gerenciamento dos documentos e chunks.

---

## Arquitetura

- **NestJS**: framework principal para estruturação do backend.
- **LangChain**: abstração para operações de chunking, embeddings e integração com vector stores.
- **Azure OpenAI**: geração dos embeddings vetoriais dos chunks.
- **ChromaDB**: vector store para persistência e busca semântica dos embeddings.
- **Docker**: ambiente isolado para o ChromaDB.

### Fluxo Principal

1. **Upload/Extração**
   - O usuário faz upload de um documento via API REST (Swagger ou HTTP).
   - O arquivo é salvo temporariamente e processado conforme o tipo (PDF, TXT, etc).
2. **Chunking**
   - O documento é dividido em chunks usando estratégias como Recursive, Token ou Character.
   - Metadados adicionais podem ser incluídos (autor, categoria, tags, etc).
3. **Geração de Embeddings**
   - Cada chunk é enviado para o Azure OpenAI, que retorna um vetor de embedding.
4. **Armazenamento no Vector Store**
   - Os chunks e seus embeddings são salvos no ChromaDB (API v2), com metadados limpos e compatíveis.
5. **Busca Semântica**
   - A API permite buscar por similaridade semântica, retornando os chunks mais próximos de uma query textual.

---

## Endpoints Principais

- `POST /api/v1/extraction/upload` — Upload e extração de documento (com chunking e vetorização)
- `POST /api/v1/extraction` — Extração de documento já existente
- `POST /api/v1/extraction/search` — Busca semântica por similaridade
- `GET /api/v1/extraction/vector-store` — Listagem dos chunks armazenados
- `GET /api/v1/extraction/health` — Health check do serviço

---

## Tecnologias Utilizadas

- **Node.js** + **NestJS**
- **LangChain** (`@langchain/community`, `@langchain/openai`)
- **ChromaDB** (vector store, rodando via Docker)
- **Azure OpenAI** (API de embeddings)
- **TypeScript**
- **Jest** (testes)
- **Swagger** (documentação e testes de API)

---

## Como Executar

1. **Clone o repositório**
2. **Configure as variáveis de ambiente** (veja `env.example`)
3. **Suba o ChromaDB**:
   ```sh
   docker-compose up -d
   ```
4. **Instale as dependências**:
   ```sh
   npm install
   ```
5. **Inicie o serviço**:
   ```sh
   npm run start:dev
   ```
6. **Acesse o Swagger**:
   - http://localhost:3000/api

---

## Observações Técnicas

- O sistema faz limpeza automática dos metadados para garantir compatibilidade com o ChromaDB v2.
- Embeddings **NÃO** são retornados nas respostas para evitar sobrecarga de memória no frontend.
- O chunking é configurável por estratégia, tamanho e sobreposição.
- O código está preparado para evoluir para outros vector stores ou provedores de embeddings.

---

## Exemplos de Uso

### Upload de Documento
- Envie um PDF, TXT, HTML ou Excel via Swagger ou API HTTP.
- Inclua metadados opcionais (autor, categoria, tags, etc).
- O sistema retorna os chunks extraídos (sem embeddings).

### Busca Semântica
- Envie uma query textual para `/api/v1/extraction/search`.
- O sistema retorna os chunks mais similares semanticamente.

---

## Futuras Evoluções
- Suporte a autenticação e autorização.
- Integração com outros provedores de embeddings.
- Interface web para visualização dos chunks e buscas.
- Monitoramento e métricas de uso.

---

## Contato
Dúvidas, sugestões ou bugs? Abra uma issue ou entre em contato com o mantenedor do projeto.