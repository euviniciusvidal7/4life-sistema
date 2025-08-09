const vendorClients = new Map(); // userId -> Set(res)

function addVendorClient(userId, res) {
  if (!vendorClients.has(userId)) vendorClients.set(userId, new Set());
  vendorClients.get(userId).add(res);
}

function removeVendorClient(userId, res) {
  if (!vendorClients.has(userId)) return;
  const set = vendorClients.get(userId);
  set.delete(res);
  if (set.size === 0) vendorClients.delete(userId);
}

function notifyLeadAssigned(vendedorId, payload) {
  const set = vendorClients.get(vendedorId);
  if (!set) return;
  const data = `event: lead_assigned\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const res of set) {
    try { res.write(data); } catch (_) {}
  }
}

module.exports = {
  addVendorClient,
  removeVendorClient,
  notifyLeadAssigned,
};