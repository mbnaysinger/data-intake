import { ConfigServerService } from '../src/modules/config/config.service';
import { AzureOpenAI } from 'openai';

async function testAzureOfficial() {
  console.log('🧪 Testando Azure OpenAI com biblioteca oficial da Microsoft...\n');

  try {
    // Carregar configurações
    const configService = new ConfigServerService();
    
    const azureApiKey = configService.get('config.openai.api_key');
    const azureEndpoint = configService.get('config.openai.endpoint');
    const azureDeploymentName = configService.get('config.openai.deployment_name') || 'text-embedding-3-large';

    console.log('📋 Configurações carregadas:');
    console.log(`   API Key: ${azureApiKey ? '✅ Configurada' : '❌ Não configurada'}`);
    console.log(`   Endpoint: ${azureEndpoint || '❌ Não configurado'}`);
    console.log(`   Deployment: ${azureDeploymentName || '❌ Não configurado'}`);
    console.log('');

    if (!azureApiKey || !azureEndpoint) {
      console.log('❌ Configuração incompleta. Verifique seu arquivo de configuração.');
      return;
    }

    // Criar cliente Azure OpenAI usando a biblioteca oficial
    console.log('🔧 Criando cliente Azure OpenAI...');
    
    const client = new AzureOpenAI({
      apiKey: azureApiKey,
      endpoint: azureEndpoint,
      apiVersion: '2024-04-01-preview',
    });

    console.log('✅ Cliente Azure OpenAI criado com sucesso');
    console.log('');

    // Testar embedding simples
    console.log('🧠 Testando geração de embedding...');
    const testText = 'Este é um teste de embedding com Azure OpenAI usando biblioteca oficial';
    
    const response = await client.embeddings.create({
      input: testText,
      model: 'text-embedding-3-large',
    });
    
    console.log('✅ Embedding gerado com sucesso!');
    console.log(`   Texto: "${testText}"`);
    console.log(`   Dimensão do embedding: ${response.data[0].embedding.length}`);
    console.log(`   Primeiros 5 valores: [${response.data[0].embedding.slice(0, 5).join(', ')}...]`);
    console.log(`   Usage: ${JSON.stringify(response.usage)}`);
    console.log('');

    // Testar múltiplos embeddings
    console.log('📚 Testando múltiplos embeddings...');
    const texts = [
      'Primeiro documento de teste',
      'Segundo documento de teste',
      'Terceiro documento de teste'
    ];
    
    const multipleResponse = await client.embeddings.create({
      input: texts,
      model: 'text-embedding-3-large',
    });
    
    console.log('✅ Múltiplos embeddings gerados com sucesso!');
    console.log(`   Documentos processados: ${multipleResponse.data.length}`);
    multipleResponse.data.forEach((item, index) => {
      console.log(`   Doc ${index + 1}: ${item.embedding.length} dimensões`);
    });
    console.log(`   Usage: ${JSON.stringify(multipleResponse.usage)}`);

    console.log('\n🎉 Todos os testes passaram! Azure OpenAI com biblioteca oficial está funcionando perfeitamente.');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
    console.error('Stack trace:', error.stack);
    
    if (error.message.includes('401')) {
      console.log('\n💡 Dica: Verifique sua API key do Azure OpenAI');
      console.log('   - Confirme que a chave está correta');
      console.log('   - Verifique se a key tem permissões adequadas');
    }
    
    if (error.message.includes('404')) {
      console.log('\n💡 Dica: Verifique o deployment no Azure OpenAI');
      console.log('   - Confirme que o deployment existe');
      console.log('   - Verifique o nome exato do deployment');
    }
    
    if (error.message.includes('platform.openai.com')) {
      console.log('\n💡 Dica: O sistema está tentando usar OpenAI em vez de Azure OpenAI');
      console.log('   - Verifique se as configurações do Azure estão corretas');
      console.log('   - Confirme que está usando o endpoint correto do Azure');
    }
  }
}

// Executar teste
testAzureOfficial().catch(console.error); 