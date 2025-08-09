// Utilitário Trello (Node/Next.js)
// Usa fetch nativo (Next 13+), sem dependências externas

const TRELLO_KEY = process.env.TRELLO_KEY;
const TRELLO_TOKEN = process.env.TRELLO_TOKEN;

const LISTS = {
  PRONTO_ENVIO: process.env.TRELLO_LIST_PRONTO_ENVIO || process.env.TRELLO_LIST_CONFIRMADOS,
  EM_TRANSITO: process.env.TRELLO_LIST_EM_TRANSITO,
  ENTREGUE_PAGO: process.env.TRELLO_LIST_ENTREGUE_PAGO,
  DEVOLVIDOS: process.env.TRELLO_LIST_DEVOLVIDOS,
  CLIENTES_A_LIGAR: process.env.TRELLO_LIST_CLIENTES_A_LIGAR,
};

function ensureCreds() {
  if (!TRELLO_KEY || !TRELLO_TOKEN) {
    throw new Error('Trello não configurado. Defina TRELLO_KEY e TRELLO_TOKEN no .env.local');
  }
}

export async function getListCards(listId) {
  ensureCreds();
  if (!listId) throw new Error('getListCards: listId ausente');
  const url = `https://api.trello.com/1/lists/${listId}/cards?key=${encodeURIComponent(TRELLO_KEY)}&token=${encodeURIComponent(TRELLO_TOKEN)}`;
  const res = await fetch(url, { method: 'GET' });
  if (!res.ok) throw new Error(`Trello getListCards failed: ${res.status}`);
  return await res.json();
}

export async function moveCardToList(cardId, listId) {
  ensureCreds();
  if (!cardId || !listId) throw new Error('moveCardToList: parâmetros ausentes');
  const url = `https://api.trello.com/1/cards/${cardId}?key=${encodeURIComponent(TRELLO_KEY)}&token=${encodeURIComponent(TRELLO_TOKEN)}`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ idList: listId }),
  });
  if (!res.ok) throw new Error(`Trello moveCardToList failed: ${res.status}`);
  return await res.json();
}

export async function updateCardDesc(cardId, desc) {
  ensureCreds();
  const url = `https://api.trello.com/1/cards/${cardId}?key=${encodeURIComponent(TRELLO_KEY)}&token=${encodeURIComponent(TRELLO_TOKEN)}`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ desc: desc?.slice(0, 16384) || '' }),
  });
  if (!res.ok) throw new Error(`Trello updateCardDesc failed: ${res.status}`);
  return await res.json();
}

export function getConfiguredListsInOrder() {
  return [
    { key: 'PRONTO_ENVIO', id: LISTS.PRONTO_ENVIO, name: 'PRONTO PARA ENVIO' },
    { key: 'EM_TRANSITO', id: LISTS.EM_TRANSITO, name: 'EM TRANSITO' },
    { key: 'ENTREGUE_PAGO', id: LISTS.ENTREGUE_PAGO, name: 'ENTREGUE - PAGO' },
    { key: 'DEVOLVIDOS', id: LISTS.DEVOLVIDOS, name: 'DEVOLVIDOS' },
    { key: 'CLIENTES_A_LIGAR', id: LISTS.CLIENTES_A_LIGAR, name: 'CLIENTES A LIGAR' },
  ].filter(l => !!l.id);
}

export function resolveTargetListByEvento(codigoEvento) {
  const code = (codigoEvento || '').toUpperCase();
  if (code === 'EMZ') return LISTS.EM_TRANSITO;
  if (code === 'EMI') return LISTS.ENTREGUE_PAGO;
  if (code === 'ΕΜΗ' || code === 'EMH' || code === 'EMV') return LISTS.DEVOLVIDOS; // EMH may appear with Greek Epsilon in docs
  return null; // sem mudança
}

export { LISTS };


