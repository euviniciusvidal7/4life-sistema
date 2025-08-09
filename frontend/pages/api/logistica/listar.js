import { getListCards, LISTS } from '@/lib/trello'

// GET /api/logistica/listar?list=PRONTO_ENVIO|EM_TRANSITO|ENTREGUE_PAGO|DEVOLVIDOS
export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  try {
    const listKey = String(req.query.list || 'PRONTO_ENVIO').toUpperCase()
    const listId = LISTS[listKey]
    if (!listId) return res.status(400).json({ error: 'Lista inválida ou não configurada' })
    const cards = await getListCards(listId)
    return res.status(200).json({ cards })
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Falha ao listar cards' })
  }
}


