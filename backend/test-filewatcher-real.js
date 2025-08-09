require('dotenv').config();
const FileWatcher = require('./src/services/FileWatcher');
const fs = require('fs-extra');
const path = require('path');

async function testFileWatcherReal() {
    console.log('🔍 Testando FileWatcher com arquivos reais...');
    
    try {
        const pastaLeads = process.env.PASTA_LEADS;
        
        // Verificar se os arquivos existem
        const arquivoRecuperacao = path.join(pastaLeads, 'lead-recuperacao.json');
        const arquivoVendido = path.join(pastaLeads, 'lead-vendido.json');
        
        const arquivoRecuperacaoExiste = await fs.pathExists(arquivoRecuperacao);
        const arquivoVendidoExiste = await fs.pathExists(arquivoVendido);
        
        console.log(`📁 Pasta de leads: ${pastaLeads}`);
        console.log(`📄 Lead Recuperação: ${arquivoRecuperacaoExiste ? '✅ Existe' : '❌ Não existe'}`);
        console.log(`📄 Lead Vendido: ${arquivoVendidoExiste ? '✅ Existe' : '❌ Não existe'}`);
        
        if (!arquivoRecuperacaoExiste || !arquivoVendidoExiste) {
            console.log('❌ Arquivos de exemplo não encontrados!');
            console.log('💡 Execute primeiro: node criar-leads-exemplo.js');
            return;
        }

        // Ler e mostrar conteúdo dos arquivos
        console.log('\n📋 Conteúdo dos arquivos:');
        
        const leadRecuperacao = await fs.readJson(arquivoRecuperacao);
        const leadVendido = await fs.readJson(arquivoVendido);
        
        console.log(`🔄 Lead Recuperação:`);
        console.log(`   - NOME: ${leadRecuperacao.NOME}`);
        console.log(`   - CONTATO: ${leadRecuperacao.CONTATO}`);
        console.log(`   - PROBLEMA_RELATADO: ${leadRecuperacao.PROBLEMA_RELATADO}`);
        console.log(`   - Rec: ${leadRecuperacao.Rec}`);
        console.log(`   - PERGUNTAS_FEITAS: ${leadRecuperacao.PERGUNTAS_FEITAS.length} perguntas`);
        
        console.log(`\n✅ Lead Vendido:`);
        console.log(`   - NOME: ${leadVendido.NOME}`);
        console.log(`   - CONTATO: ${leadVendido.CONTATO}`);
        console.log(`   - PROBLEMA_RELATADO: ${leadVendido.PROBLEMA_RELATADO}`);
        console.log(`   - Rec: ${leadVendido.Rec}`);
        console.log(`   - PACOTE_ESCOLHIDO: ${leadVendido.PACOTE_ESCOLHIDO}`);
        console.log(`   - ENDEREÇO: ${leadVendido.ENDEREÇO}`);

        // Iniciar FileWatcher
        console.log('\n🚀 Iniciando FileWatcher...');
        const fileWatcher = new FileWatcher();
        await fileWatcher.iniciar();

        console.log('✅ FileWatcher iniciado com sucesso!');
        console.log('⏰ Aguardando processamento automático...');
        console.log('💡 Os arquivos serão processados após 10 minutos de delay');

        // Aguardar um pouco para ver o processamento
        setTimeout(async () => {
            console.log('\n📊 Estatísticas do FileWatcher:');
            console.log(fileWatcher.getEstatisticas());

            // Parar o FileWatcher
            await fileWatcher.parar();
            console.log('🛑 FileWatcher parado');

            console.log('\n🎉 Teste do FileWatcher com arquivos reais concluído!');
            console.log('💡 Os arquivos continuam na pasta para processamento futuro');
            
            process.exit(0);

        }, 15000); // 15 segundos

    } catch (error) {
        console.error('❌ Erro no teste do FileWatcher:', error);
        process.exit(1);
    }
}

testFileWatcherReal();
