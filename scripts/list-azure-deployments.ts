import { ConfigServerService } from '../src/modules/config/config.service';
import { AzureOpenAI } from 'openai';

async function listAzureDeployments() {
  console.log('🔍 Listando deployments disponíveis no Azure OpenAI...\n');

  try {
    // Carregar configurações
    const configService = new ConfigServerService();
    
    const azureApiKey = configService.get('config.openai.api_key');
    const azureEndpoint = configService.get('config.openai.endpoint');

    console.log('📋 Configurações carregadas:');
    console.log(`   API Key: ${azureApiKey ? '✅ Configurada' : '❌ Não configurada'}`);
    console.log(`   Endpoint: ${azureEndpoint || '❌ Não configurado'}`);
    console.log('');

    if (!azureApiKey || !azureEndpoint) {
      console.log('❌ Configuração incompleta. Verifique seu arquivo de configuração.');
      return;
    }

    // Criar cliente Azure OpenAI
    console.log('🔧 Criando cliente Azure OpenAI...');
    
    const client = new AzureOpenAI({
      apiKey: azureApiKey,
      endpoint: azureEndpoint,
      apiVersion: '2024-04-01-preview',
    });

    console.log('✅ Cliente Azure OpenAI criado com sucesso');
    console.log('');

    // Listar deployments
    console.log('📋 Listando deployments disponíveis...');
    
    const deployments = await client.models.list();
    
    console.log('✅ Deployments encontrados:');
    console.log('');
    
    deployments.data.forEach((deployment, index) => {
      console.log(`${index + 1}. Nome: ${deployment.id}`);
      console.log(`   Tipo: ${deployment.object}`);
      console.log(`   Criado: ${deployment.created}`);
      console.log(`   Propriedades: ${JSON.stringify(deployment)}`);
      console.log('');
    });

    // Filtrar apenas modelos de embedding
    console.log('🧠 Modelos de Embedding disponíveis:');
    const embeddingModels = deployments.data.filter(model => 
      model.id.toLowerCase().includes('embedding') || 
      model.id.toLowerCase().includes('ada')
    );
    
    if (embeddingModels.length > 0) {
      embeddingModels.forEach((model, index) => {
        console.log(`${index + 1}. ${model.id}`);
      });
    } else {
      console.log('❌ Nenhum modelo de embedding encontrado');
    }

    console.log('\n💡 Dica: Use um dos nomes acima na configuração deployment_name');

  } catch (error) {
    console.error('❌ Erro durante a listagem:', error.message);
    console.error('Stack trace:', error.stack);
    
    if (error.message.includes('401')) {
      console.log('\n💡 Dica: Verifique sua API key do Azure OpenAI');
    }
    
    if (error.message.includes('404')) {
      console.log('\n💡 Dica: Verifique se o endpoint está correto');
    }
  }
}

// Executar listagem
listAzureDeployments().catch(console.error); 