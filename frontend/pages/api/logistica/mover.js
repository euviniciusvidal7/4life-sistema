import { getListCards, moveCardToList, LISTS } from '@/lib/trello'

// POST /api/logistica/mover
// body: { target: 'EM_TRANSITO'|'ENTREGUE_PAGO'|'DEVOLVIDOS', lead: { id, nome, contato } }
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  try {
    const { target, lead } = req.body || {}
    if (!target || !lead) return res.status(400).json({ error: 'target e lead são obrigatórios' })

    const targetListId = LISTS[target]
    if (!targetListId) return res.status(400).json({ error: `Lista alvo não configurada para ${target}` })

    // Procurar o card correspondente ao lead na lista PRONTO_ENVIO
    const cards = await getListCards(LISTS.PRONTO_ENVIO)
    const nome = String(lead?.nome || '').trim().toLowerCase()
    const contato = String(lead?.contato || '').replace(/\s+/g, '').toLowerCase()
    const leadId = String(lead?.id || '')

    // Heurística de matching: por id no desc ou por nome/contato no título
    let found = null
    for (const c of cards) {
      const title = String(c.name || '').toLowerCase()
      const desc = String(c.desc || '')
      if (leadId && desc.includes(leadId)) { found = c; break }
      if (nome && title.includes(nome)) { found = c; break }
      if (contato && title.replace(/\s+/g, '').includes(contato)) { found = c; break }
    }

    if (!found) return res.status(404).json({ error: 'Card do Trello não encontrado na lista PRONTO PARA ENVIO' })

    await moveCardToList(found.id, targetListId)
    return res.status(200).json({ success: true, movedCardId: found.id, to: target })
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Falha ao mover card' })
  }
}


