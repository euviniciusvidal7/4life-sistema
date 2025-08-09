// Rota de sincronização de logística
// GET/POST /api/logistica/sincronizar
// - Lê cards da lista PRONTO PARA ENVIO
// - Para cada card, extrai NObjecto do nome (ou ignora se não encontrar)
// - Consulta status no serviço de rastreamento (mock)
// - Move o card de acordo com o _CodigoEvento

import { getListCards, moveCardToList, updateCardDesc, resolveTargetListByEvento, LISTS } from '@/lib/trello';
import { consultarStatus } from '@/lib/rastreamento';

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    if (!LISTS.PRONTO_ENVIO) {
      return res.status(400).json({ error: 'TRELLO_LIST_PRONTO_ENVIO não configurado' });
    }

    const cards = await getListCards(LISTS.PRONTO_ENVIO);
    let moved = 0;
    let skipped = 0;
    let errors = 0;
    const details = [];

    for (const card of cards) {
      try {
        // Extrair NObjecto do nome do card (heurística: última palavra com letras+digitos)
        const name = String(card.name || '').trim();
        const match = name.match(/[A-Z0-9]{5,}/gi);
        const nObjecto = match ? match[match.length - 1] : null;
        if (!nObjecto) {
          skipped++;
          details.push({ cardId: card.id, reason: 'no_nobjecto' });
          continue;
        }

        const status = await consultarStatus(nObjecto);
        const destino = resolveTargetListByEvento(status?._CodigoEvento);
        if (!destino || destino === LISTS.PRONTO_ENVIO) {
          skipped++;
          details.push({ cardId: card.id, nObjecto, evento: status?._CodigoEvento || null, action: 'no_change' });
          continue;
        }

        await moveCardToList(card.id, destino);
        // Se devolvido, atualizar descrição com detalhes
        if (destino === LISTS.DEVOLVIDOS) {
          const extra = `\n\n[Atualização de Rastreamento]\nEvento: ${status?._CodigoEvento || ''}\nDescrição: ${status?._DescricaoEvento || ''}\nMotivo: ${status?._CodigoMotivo || ''}\nSituação: ${status?._CodigoSituacao || ''}`;
          await updateCardDesc(card.id, (card.desc || '') + extra);
        }

        moved++;
        details.push({ cardId: card.id, nObjecto, evento: status?._CodigoEvento, movedTo: destino });
      } catch (e) {
        errors++;
        details.push({ cardId: card?.id, error: e?.message });
      }
    }

    return res.status(200).json({ status: 'success', moved_cards: moved, skipped, errors, total_scanned: cards.length, details });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error?.message || 'Falha na sincronização' });
  }
}


