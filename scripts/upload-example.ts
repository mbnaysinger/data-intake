import axios from 'axios';
import FormData from 'form-data';
import * as fs from 'fs';
import * as path from 'path';

const API_BASE_URL = 'http://localhost:3000';

async function testUpload() {
  try {
    console.log('🚀 Iniciando teste de upload...');
    
    // Verificar se o arquivo de exemplo existe
    const testFilePath = path.join(__dirname, '../documents/exemplo.txt');
    if (!fs.existsSync(testFilePath)) {
      console.log('📝 Criando arquivo de exemplo...');
      fs.writeFileSync(testFilePath, 'Este é um documento de exemplo para testar a extração e chunking. Contém informações importantes sobre o projeto de data intake.');
    }

    // Criar FormData
    const formData = new FormData();
    formData.append('file', fs.createReadStream(testFilePath), 'exemplo.txt');
    formData.append('author', 'Sistema de Teste');
    formData.append('category', 'teste');
    formData.append('department', 'TI');
    formData.append('tags', 'exemplo,teste,2024');
    formData.append('chunkingStrategy', 'recursive');
    formData.append('chunkSize', '500');
    formData.append('chunkOverlap', '100');
    formData.append('saveToVectorStore', 'true');

    console.log('📤 Fazendo upload do arquivo...');
    
    const response = await axios.post(`${API_BASE_URL}/api/v1/extraction/upload`, formData, {
      headers: {
        ...formData.getHeaders(),
      },
      timeout: 30000, // 30 segundos
    });

    console.log('✅ Upload realizado com sucesso!');
    console.log('📊 Resultado:', JSON.stringify(response.data, null, 2));

    // Testar listagem do vector store
    console.log('\n🔍 Testando listagem do vector store...');
    const vectorStoreResponse = await axios.get(`${API_BASE_URL}/api/v1/extraction/vector-store`);
    console.log(`📚 Total de chunks no vector store: ${vectorStoreResponse.data.length}`);

    // Testar busca semântica
    console.log('\n🔎 Testando busca semântica...');
    const searchResponse = await axios.post(`${API_BASE_URL}/api/v1/extraction/search`, {
      query: 'documento exemplo',
      k: 3,
    });
    console.log(`🔍 Resultados da busca: ${searchResponse.data.length} documentos encontrados`);

  } catch (error) {
    console.error('❌ Erro durante o teste:', error.response?.data || error.message);
    
    if (error.response?.status === 500) {
      console.log('\n💡 Dicas para resolver problemas:');
      console.log('1. Verifique se o ChromaDB está rodando: docker-compose up -d');
      console.log('2. Verifique se as variáveis de ambiente estão configuradas');
      console.log('3. Verifique se o Azure OpenAI está configurado corretamente');
    }
  }
}

async function testHealthCheck() {
  try {
    console.log('🏥 Verificando saúde do serviço...');
    const response = await axios.get(`${API_BASE_URL}/api/v1/extraction/health`);
    console.log('✅ Serviço está saudável:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Serviço não está respondendo:', error.message);
    return false;
  }
}

async function main() {
  console.log('🧪 Iniciando testes do módulo de extração...\n');
  
  // Primeiro verificar se o serviço está rodando
  const isHealthy = await testHealthCheck();
  if (!isHealthy) {
    console.log('❌ Serviço não está disponível. Execute: npm run start:dev');
    process.exit(1);
  }
  
  // Testar upload
  await testUpload();
  
  console.log('\n🎉 Testes concluídos!');
}

main().catch(console.error); 