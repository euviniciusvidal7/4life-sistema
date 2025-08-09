'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
      // Redirecionamento padrão: login → após logar caímos no layout novo
      const token = localStorage.getItem('token');
      router.push(token ? '/dashboard' : '/login');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-white text-2xl font-bold">4L</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">4Life Sistema</h1>
        <p className="text-gray-600">Redirecionando...</p>
      </div>
    </div>
  );
}
