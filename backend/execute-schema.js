require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function executeSchema() {
    console.log('🚀 Executando schema do banco de dados...');
    
    try {
        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        // Ler o arquivo schema.sql
        const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
        const schemaSQL = fs.readFileSync(schemaPath, 'utf8');

        console.log('📄 Schema carregado com sucesso');
        console.log('🔧 Executando comandos SQL...');

        // Dividir o schema em comandos individuais
        const commands = schemaSQL
            .split(';')
            .map(cmd => cmd.trim())
            .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

        console.log(`📊 Executando ${commands.length} comandos SQL...`);

        let successCount = 0;
        let errorCount = 0;

        for (let i = 0; i < commands.length; i++) {
            const command = commands[i];
            
            try {
                // Executar comando via RPC (se disponível) ou tentar método alternativo
                const { data, error } = await supabase.rpc('exec_sql', { 
                    sql_command: command 
                });

                if (error) {
                    console.log(`⚠️  Comando ${i + 1} falhou (pode ser normal): ${error.message}`);
                    errorCount++;
                } else {
                    successCount++;
                }
            } catch (err) {
                console.log(`⚠️  Comando ${i + 1} não executado (pode ser normal): ${err.message}`);
                errorCount++;
            }
        }

        console.log(`\n📈 Resultado da execução:`);
        console.log(`✅ Comandos executados com sucesso: ${successCount}`);
        console.log(`❌ Comandos com erro: ${errorCount}`);

        if (errorCount > 0) {
            console.log('\n💡 Alguns comandos podem ter falhado porque:');
            console.log('- As tabelas já existem');
            console.log('- As funções já existem');
            console.log('- As políticas RLS já existem');
            console.log('- Isso é normal na primeira execução');
        }

        console.log('\n🎉 Schema executado! Agora vamos testar...');

        // Testar se as tabelas foram criadas
        await testTables();

    } catch (error) {
        console.error('❌ Erro ao executar schema:', error.message);
        console.log('\n💡 Alternativa: Execute o schema manualmente no Supabase Dashboard');
    }
}

async function testTables() {
    console.log('\n🔍 Testando se as tabelas foram criadas...');
    
    try {
        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        const tables = ['user_profiles', 'leads', 'lead_distribuicoes', 'vendedor_stats'];

        for (const table of tables) {
            try {
                const { data, error } = await supabase
                    .from(table)
                    .select('*')
                    .limit(1);

                if (error) {
                    console.log(`❌ Tabela ${table}: ${error.message}`);
                } else {
                    console.log(`✅ Tabela ${table}: OK`);
                }
            } catch (err) {
                console.log(`❌ Tabela ${table}: ${err.message}`);
            }
        }

        console.log('\n🎯 Teste concluído!');
        console.log('💡 Se todas as tabelas estão OK, você pode criar o admin agora.');

    } catch (error) {
        console.error('❌ Erro no teste:', error.message);
    }
}

executeSchema();
