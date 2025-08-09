'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <div className="space-y-6">
        {/* Placeholder do overview até termos cards específicos do dashboard */}
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-sm text-gray-400">Resumo rápido</p>
      </div>
    </ProtectedRoute>
  );
}
