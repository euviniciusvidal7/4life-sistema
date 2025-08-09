const superagent = require('superagent');
const logger = require('./logger');

const TRELLO_KEY = process.env.TRELLO_KEY;
const TRELLO_TOKEN = process.env.TRELLO_TOKEN;
const LIST_PRONTO_ENVIO = process.env.TRELLO_LIST_PRONTO_ENVIO || process.env.TRELLO_LIST_CONFIRMADOS;
const LIST_EM_TRANSITO = process.env.TRELLO_LIST_EM_TRANSITO;
const LIST_ENTREGUE_PAGO = process.env.TRELLO_LIST_ENTREGUE_PAGO;
const LIST_DEVOLVIDOS = process.env.TRELLO_LIST_DEVOLVIDOS;
const LIST_CLIENTES_A_LIGAR = process.env.TRELLO_LIST_CLIENTES_A_LIGAR;

async function createCard({ name, desc, listId, labels = [], due = null }) {
  if (!TRELLO_KEY || !TRELLO_TOKEN) {
    logger.warn('Trello não configurado (TRELLO_KEY/TRELLO_TOKEN ausentes). Pulando envio.');
    return { success: false, skipped: true, reason: 'missing_credentials' };
  }
  if (!listId) {
    const envList = process.env.TRELLO_LIST_ID || process.env.TRELLO_LIST_CONFIRMADOS;
    if (!envList) {
      logger.warn('Trello: id de lista ausente (TRELLO_LIST_ID). Pulando envio.');
      return { success: false, skipped: true, reason: 'missing_list' };
    }
    listId = envList;
  }

  try {
    const res = await superagent
      .post('https://api.trello.com/1/cards')
      .query({ key: TRELLO_KEY, token: TRELLO_TOKEN })
      .type('form')
      .send({ idList: listId, name: name?.slice(0, 512) || 'Novo Cliente', desc: desc?.slice(0, 16384) || '', pos: 'top' });

    const card = res.body || {};

    // Labels (opcional)
    if (labels && labels.length > 0 && card.id) {
      for (const labelName of labels) {
        try {
          await superagent
            .post(`https://api.trello.com/1/cards/${card.id}/labels`)
            .query({ key: TRELLO_KEY, token: TRELLO_TOKEN })
            .type('form')
            .send({ name: labelName, color: 'blue' });
        } catch (e) {
          logger.warn('Trello: falha ao adicionar label', { error: e?.message });
        }
      }
    }

    // Due date (opcional)
    if (due && card.id) {
      try {
        await superagent
          .put(`https://api.trello.com/1/cards/${card.id}`)
          .query({ key: TRELLO_KEY, token: TRELLO_TOKEN })
          .type('form')
          .send({ due });
      } catch (e) {
        logger.warn('Trello: falha ao definir due date', { error: e?.message });
      }
    }

    logger.info('Trello: card criado', { id: card.id, url: card.url });
    return { success: true, id: card.id, url: card.url };
  } catch (error) {
    logger.error('Trello: erro ao criar card', { error: error?.message });
    return { success: false, error: error?.message };
  }
}

function buildCardPayloadFromLead(lead, vendedor) {
  const linhas = [];
  const push = (k, v) => {
    if (v === undefined || v === null || v === '') return;
    linhas.push(`- ${k}: ${typeof v === 'string' ? v : JSON.stringify(v)}`);
  };

  push('Nome', lead?.nome || lead?.NOME);
  push('Contato', lead?.contato || lead?.CONTATO);
  push('Endereço', lead?.endereco || lead?.ENDEREÇO || lead?.ENDERECO);
  push('Problema Relatado', lead?.problema_relatado || lead?.PROBLEMA_RELATADO);
  push('Pacote Escolhido', lead?.pacote_escolhido || lead?.PACOTE_ESCOLHIDO);
  push('Valor Final', lead?.valor_final || lead?.VALOR_FINAL);
  push('REC', lead?.rec);
  push('Tipo Lead', lead?.tipo_lead);
  push('Arquivo', lead?.arquivo_original);
  push('Lead ID', lead?.id);
  if (vendedor) {
    push('Vendedor', vendedor?.nome_completo || vendedor?.login || vendedor?.id);
  }

  const name = `${lead?.nome || 'Cliente'} - ${lead?.contato || ''}`.trim();
  const desc = linhas.join('\n');

  return { name, desc };
}

module.exports = {
  createCard,
  buildCardPayloadFromLead,
  async getListCards(listId) {
    if (!TRELLO_KEY || !TRELLO_TOKEN || !listId) return { success: false, cards: [] };
    try {
      const res = await superagent
        .get(`https://api.trello.com/1/lists/${listId}/cards`)
        .query({ key: TRELLO_KEY, token: TRELLO_TOKEN });
      return { success: true, cards: res.body || [] };
    } catch (e) {
      logger.error('Trello: erro ao listar cards', { error: e?.message, listId });
      return { success: false, cards: [] };
    }
  },
  async moveCardToList(cardId, listId) {
    if (!TRELLO_KEY || !TRELLO_TOKEN || !cardId || !listId) return { success: false };
    try {
      await superagent
        .put(`https://api.trello.com/1/cards/${cardId}`)
        .query({ key: TRELLO_KEY, token: TRELLO_TOKEN })
        .type('form')
        .send({ idList: listId });
      return { success: true };
    } catch (e) {
      logger.error('Trello: erro ao mover card', { error: e?.message, cardId, listId });
      return { success: false, error: e?.message };
    }
  },
  getConfiguredListsInOrder() {
    return [
      { key: 'pronto_envio', id: LIST_PRONTO_ENVIO, name: 'PRONTO PARA ENVIO' },
      { key: 'em_transito', id: LIST_EM_TRANSITO, name: 'EM TRANSITO' },
      { key: 'entregue_pago', id: LIST_ENTREGUE_PAGO, name: 'ENTREGUE - PAGO' },
      { key: 'devolvidos', id: LIST_DEVOLVIDOS, name: 'DEVOLVIDOS' },
      { key: 'clientes_a_ligar', id: LIST_CLIENTES_A_LIGAR, name: 'CLIENTES A LIGAR' },
    ].filter(l => !!l.id);
  },
};


