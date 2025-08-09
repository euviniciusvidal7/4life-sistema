"use client"

import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, defs
} from 'recharts'

export default function MiniAreaChart({ data }: { data: { label: string; value: number }[] }) {
  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ left: 8, right: 8, top: 8, bottom: 0 }}>
          <defs>
            <linearGradient id="gradLine" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.6}/>
              <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" />
          <XAxis dataKey="label" tick={{ fill: '#9CA3AF', fontSize: 12 }} tickLine={false} axisLine={{ stroke: '#374151' }} />
          <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} tickLine={false} axisLine={{ stroke: '#374151' }} width={32} />
          <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151' }} labelStyle={{ color: '#E5E7EB' }} />
          <Area type="monotone" dataKey="value" stroke="#22d3ee" strokeWidth={2} fillOpacity={1} fill="url(#gradLine)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}


