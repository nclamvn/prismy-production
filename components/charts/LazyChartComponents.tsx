'use client'

import dynamic from 'next/dynamic'
import { ComponentType } from 'react'

// Loading component for charts
const ChartLoading = () => (
  <div className="w-full h-full flex items-center justify-center">
    <div className="animate-pulse space-y-4 w-full">
      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
      <div className="h-48 bg-gray-200 rounded"></div>
      <div className="flex space-x-4">
        <div className="h-4 bg-gray-200 rounded w-1/6"></div>
        <div className="h-4 bg-gray-200 rounded w-1/6"></div>
        <div className="h-4 bg-gray-200 rounded w-1/6"></div>
      </div>
    </div>
  </div>
)

// Lazy-loaded Recharts components
export const LazyLineChart = dynamic(
  () => import('recharts').then(mod => ({ default: mod.LineChart })),
  {
    loading: () => <ChartLoading />,
    ssr: false
  }
)

export const LazyAreaChart = dynamic(
  () => import('recharts').then(mod => ({ default: mod.AreaChart })),
  {
    loading: () => <ChartLoading />,
    ssr: false
  }
)

export const LazyBarChart = dynamic(
  () => import('recharts').then(mod => ({ default: mod.BarChart })),
  {
    loading: () => <ChartLoading />,
    ssr: false
  }
)

export const LazyPieChart = dynamic(
  () => import('recharts').then(mod => ({ default: mod.PieChart })),
  {
    loading: () => <ChartLoading />,
    ssr: false
  }
)

export const LazyResponsiveContainer = dynamic(
  () => import('recharts').then(mod => ({ default: mod.ResponsiveContainer })),
  {
    loading: () => <div className="w-full h-full bg-gray-100 animate-pulse rounded"></div>,
    ssr: false
  }
)

// Chart components that don't need lazy loading (lightweight)
export { Line, Area, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Pie, Cell } from 'recharts'