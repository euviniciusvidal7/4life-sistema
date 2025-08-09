require('dotenv').config();
const FileWatcher = require('./src/services/FileWatcher');
const fs = require('fs-extra');
const path = require('path');

async function testFileWatcher() {
    console.log('🔍 Testando FileWatcher...');
    
    try {
        // Criar pasta de leads se não existir
        const pastaLeads = process.env.PASTA_LEADS;
        await fs.ensureDir(pastaLeads);
        console.log(`📁 Pasta de leads: ${pastaLeads}`);

        // Criar arquivo de teste
        const arquivoTeste = path.join(pastaLeads, 'teste-lead.json');
        const leadTeste = {
            NOME: "João Silva",
            ENDEREÇO: "Rua das Flores, 123 - São Paulo/SP",
            CONTATO: "(11) 99999-9999",
            PROBLEMA_RELATADO: "Cliente interessado em plano de internet",
            CONVERSA_IA: "Cliente demonstrou interesse em planos de internet de alta velocidade",
            PACOTE_ESCOLHIDO: "Plano 100MB",
            VALOR_FINAL: "89.90",
            rec: false
        };

        await fs.writeJson(arquivoTeste, leadTeste, { spaces: 2 });
        console.log('📄 Arquivo de teste criado:', path.basename(arquivoTeste));

        // Iniciar FileWatcher
        const fileWatcher = new FileWatcher();
        await fileWatcher.iniciar();

        console.log('✅ FileWatcher iniciado com sucesso!');
        console.log('⏰ Aguardando processamento automático...');

        // Aguardar um pouco para ver o processamento
        setTimeout(async () => {
            console.log('\n📊 Estatísticas do FileWatcher:');
            console.log(fileWatcher.getEstatisticas());

            // Parar o FileWatcher
            await fileWatcher.parar();
            console.log('🛑 FileWatcher parado');

            // Limpar arquivo de teste
            await fs.remove(arquivoTeste);
            console.log('🧹 Arquivo de teste removido');

            console.log('\n🎉 Teste do FileWatcher concluído!');
            process.exit(0);

        }, 15000); // 15 segundos

    } catch (error) {
        console.error('❌ Erro no teste do FileWatcher:', error);
        process.exit(1);
    }
}

testFileWatcher();
