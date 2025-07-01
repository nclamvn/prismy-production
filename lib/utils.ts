import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { vietnameseUtils } from '@/tokens'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num)
}

export function formatVND(amount: number): string {
  return vietnameseUtils.formatVNDWithPattern(amount)
}

export function formatVietnameseDate(date: Date): string {
  return new Intl.DateTimeFormat('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

export function getBilingualText(en: string, vi: string): string {
  return vietnameseUtils.getBilingualText(en, vi)
}

export function slugify(str: string): string {
  return str
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
}