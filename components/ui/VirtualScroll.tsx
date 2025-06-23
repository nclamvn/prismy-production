'use client'

import {
  useRef,
  useState,
  useEffect,
  useCallback,
  CSSProperties,
  ReactNode,
} from 'react'
import { cn } from '@/lib/utils'

/* ============================================================================ */
/* PRISMY VIRTUAL SCROLLING SYSTEM */
/* High-performance virtual scrolling for 60fps smooth lists */
/* ============================================================================ */

interface VirtualScrollProps<T> {
  items: T[]
  height: number // Container height
  itemHeight: number | ((index: number) => number) // Fixed or dynamic height
  renderItem: (item: T, index: number) => ReactNode
  overscan?: number // Number of items to render outside viewport
  className?: string
  onScroll?: (scrollTop: number) => void
  estimatedItemHeight?: number // For dynamic heights
  getItemKey?: (item: T, index: number) => string | number
  scrollToIndex?: number
  horizontal?: boolean
}

export function VirtualScroll<T>({
  items,
  height,
  itemHeight,
  renderItem,
  overscan = 3,
  className,
  onScroll,
  estimatedItemHeight = 50,
  getItemKey,
  scrollToIndex,
  horizontal = false,
}: VirtualScrollProps<T>) {
  const scrollElementRef = useRef<HTMLDivElement>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [isScrolling, setIsScrolling] = useState(false)
  const scrollTimeoutRef = useRef<NodeJS.Timeout>()

  // Calculate item heights for dynamic sizing
  const itemHeights = useRef<Map<number, number>>(new Map())
  const measuredHeights = useRef<Map<number, number>>(new Map())

  // Get item height (fixed or dynamic)
  const getHeight = useCallback(
    (index: number): number => {
      if (typeof itemHeight === 'function') {
        // Check if we have a measured height
        const measured = measuredHeights.current.get(index)
        if (measured) return measured

        // Use provided function or estimate
        const calculated = itemHeight(index)
        itemHeights.current.set(index, calculated)
        return calculated
      }
      return itemHeight
    },
    [itemHeight]
  )

  // Calculate total height
  const getTotalHeight = useCallback((): number => {
    if (typeof itemHeight === 'number') {
      return items.length * itemHeight
    }

    let total = 0
    for (let i = 0; i < items.length; i++) {
      total += getHeight(i)
    }
    return total
  }, [items.length, itemHeight, getHeight])

  // Get item offset
  const getItemOffset = useCallback(
    (index: number): number => {
      if (typeof itemHeight === 'number') {
        return index * itemHeight
      }

      let offset = 0
      for (let i = 0; i < index; i++) {
        offset += getHeight(i)
      }
      return offset
    },
    [itemHeight, getHeight]
  )

  // Find start index for current scroll position
  const findStartIndex = useCallback(
    (scrollTop: number): number => {
      if (typeof itemHeight === 'number') {
        return Math.floor(scrollTop / itemHeight)
      }

      let accumulatedHeight = 0
      for (let i = 0; i < items.length; i++) {
        accumulatedHeight += getHeight(i)
        if (accumulatedHeight > scrollTop) {
          return Math.max(0, i - 1)
        }
      }
      return items.length - 1
    },
    [items.length, itemHeight, getHeight]
  )

  // Calculate visible range
  const calculateVisibleRange = useCallback(() => {
    const scrollElement = scrollElementRef.current
    if (!scrollElement) return { start: 0, end: 0 }

    const scrollPosition = horizontal
      ? scrollElement.scrollLeft
      : scrollElement.scrollTop
    const containerSize = horizontal
      ? scrollElement.clientWidth
      : scrollElement.clientHeight

    const startIndex = Math.max(0, findStartIndex(scrollPosition) - overscan)
    let endIndex = startIndex
    let accumulatedSize = 0

    for (let i = startIndex; i < items.length; i++) {
      if (accumulatedSize > containerSize + scrollPosition) {
        endIndex = Math.min(items.length - 1, i + overscan)
        break
      }
      accumulatedSize = getItemOffset(i + 1) - getItemOffset(startIndex)
    }

    return { start: startIndex, end: endIndex || items.length - 1 }
  }, [
    horizontal,
    findStartIndex,
    overscan,
    items.length,
    getItemOffset,
  ])

  const [visibleRange, setVisibleRange] = useState(() =>
    calculateVisibleRange()
  )

  // Handle scroll with debouncing
  const handleScroll = useCallback(() => {
    const scrollElement = scrollElementRef.current
    if (!scrollElement) return

    const newScrollTop = horizontal
      ? scrollElement.scrollLeft
      : scrollElement.scrollTop

    setScrollTop(newScrollTop)
    setIsScrolling(true)

    // Update visible range
    const newRange = calculateVisibleRange()
    setVisibleRange(newRange)

    // Call external scroll handler
    onScroll?.(newScrollTop)

    // Reset scrolling state after delay
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current)
    }
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false)
    }, 150)
  }, [horizontal, calculateVisibleRange, onScroll])

  // Scroll to index
  useEffect(() => {
    if (
      scrollToIndex !== undefined &&
      scrollToIndex >= 0 &&
      scrollToIndex < items.length
    ) {
      const offset = getItemOffset(scrollToIndex)
      scrollElementRef.current?.scrollTo({
        [horizontal ? 'left' : 'top']: offset,
        behavior: 'smooth',
      })
    }
  }, [scrollToIndex, getItemOffset, horizontal, items.length])

  // Measure item heights for dynamic sizing
  const measureItem = useCallback((index: number, element: HTMLElement) => {
    if (typeof itemHeight === 'function') {
      const size = horizontal
        ? element.offsetWidth
        : element.offsetHeight
      const previousSize = measuredHeights.current.get(index)
      
      if (previousSize !== size) {
        measuredHeights.current.set(index, size)
        // Force re-render if size changed
        if (previousSize !== undefined) {
          handleScroll()
        }
      }
    }
  }, [itemHeight, horizontal, handleScroll])

  // Create visible items
  const visibleItems = []
  for (let i = visibleRange.start; i <= visibleRange.end; i++) {
    const item = items[i]
    if (!item) continue

    const key = getItemKey ? getItemKey(item, i) : i
    const offset = getItemOffset(i)

    visibleItems.push(
      <div
        key={key}
        ref={(el) => el && measureItem(i, el)}
        style={{
          position: 'absolute',
          [horizontal ? 'left' : 'top']: offset,
          [horizontal ? 'top' : 'left']: 0,
          [horizontal ? 'height' : 'width']: '100%',
          willChange: isScrolling ? 'transform' : 'auto',
        }}
      >
        {renderItem(item, i)}
      </div>
    )
  }

  const totalSize = getTotalHeight()

  return (
    <div
      ref={scrollElementRef}
      className={cn(
        'relative overflow-auto',
        horizontal ? 'overflow-x-auto overflow-y-hidden' : 'overflow-y-auto overflow-x-hidden',
        className
      )}
      style={{
        [horizontal ? 'width' : 'height']: height,
        contain: 'strict',
        willChange: 'scroll-position',
      }}
      onScroll={handleScroll}
    >
      <div
        style={{
          [horizontal ? 'width' : 'height']: totalSize,
          [horizontal ? 'height' : 'width']: '100%',
          position: 'relative',
        }}
      >
        {visibleItems}
      </div>
    </div>
  )
}

/* ============================================================================ */
/* SPECIALIZED VIRTUAL LIST COMPONENTS */
/* ============================================================================ */

// Virtual table with sticky header
export function VirtualTable<T>({
  items,
  columns,
  height = 600,
  rowHeight = 48,
  className,
  onRowClick,
}: {
  items: T[]
  columns: Array<{
    key: string
    header: string
    width?: number
    render?: (item: T) => ReactNode
  }>
  height?: number
  rowHeight?: number
  className?: string
  onRowClick?: (item: T, index: number) => void
}) {
  return (
    <div className={cn('border border-gray-200 rounded-lg', className)}>
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-gray-50 border-b border-gray-200">
        <div className="flex">
          {columns.map((column) => (
            <div
              key={column.key}
              className="px-4 py-3 text-sm font-medium text-gray-900"
              style={{ width: column.width || `${100 / columns.length}%` }}
            >
              {column.header}
            </div>
          ))}
        </div>
      </div>

      {/* Virtual rows */}
      <VirtualScroll
        items={items}
        height={height - 48} // Subtract header height
        itemHeight={rowHeight}
        renderItem={(item, index) => (
          <div
            className={cn(
              'flex border-b border-gray-100 hover:bg-gray-50 transition-colors',
              onRowClick && 'cursor-pointer'
            )}
            onClick={() => onRowClick?.(item, index)}
          >
            {columns.map((column) => (
              <div
                key={column.key}
                className="px-4 py-3 text-sm text-gray-700"
                style={{ width: column.width || `${100 / columns.length}%` }}
              >
                {column.render
                  ? column.render(item)
                  : (item as any)[column.key]}
              </div>
            ))}
          </div>
        )}
      />
    </div>
  )
}

// Virtual grid layout
export function VirtualGrid<T>({
  items,
  height = 600,
  columnCount = 3,
  itemHeight,
  gap = 16,
  renderItem,
  className,
}: {
  items: T[]
  height?: number
  columnCount?: number
  itemHeight: number
  gap?: number
  renderItem: (item: T, index: number) => ReactNode
  className?: string
}) {
  // Transform items into rows
  const rows = []
  for (let i = 0; i < items.length; i += columnCount) {
    rows.push(items.slice(i, i + columnCount))
  }

  return (
    <VirtualScroll
      items={rows}
      height={height}
      itemHeight={itemHeight + gap}
      className={className}
      renderItem={(row, rowIndex) => (
        <div
          className="flex"
          style={{ gap, paddingRight: gap, paddingBottom: gap }}
        >
          {row.map((item, colIndex) => {
            const index = rowIndex * columnCount + colIndex
            return (
              <div
                key={index}
                style={{ width: `calc(${100 / columnCount}% - ${gap}px)` }}
              >
                {renderItem(item, index)}
              </div>
            )
          })}
        </div>
      )}
    />
  )
}

// Infinite scroll wrapper
export function InfiniteVirtualScroll<T>({
  items,
  loadMore,
  hasMore,
  loading,
  threshold = 200,
  ...virtualScrollProps
}: VirtualScrollProps<T> & {
  loadMore: () => void | Promise<void>
  hasMore: boolean
  loading?: boolean
  threshold?: number
}) {
  const loadingRef = useRef(false)

  const handleScroll = useCallback(
    (scrollTop: number) => {
      const scrollElement = document.querySelector('.virtual-scroll-container')
      if (!scrollElement || loadingRef.current || !hasMore) return

      const scrollHeight = scrollElement.scrollHeight
      const clientHeight = scrollElement.clientHeight
      const scrollBottom = scrollHeight - scrollTop - clientHeight

      if (scrollBottom < threshold) {
        loadingRef.current = true
        Promise.resolve(loadMore()).finally(() => {
          loadingRef.current = false
        })
      }

      virtualScrollProps.onScroll?.(scrollTop)
    },
    [hasMore, threshold, loadMore, virtualScrollProps]
  )

  return (
    <>
      <VirtualScroll
        {...virtualScrollProps}
        items={items}
        onScroll={handleScroll}
        className={cn('virtual-scroll-container', virtualScrollProps.className)}
      />
      {loading && (
        <div className="flex justify-center p-4">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-gray-900" />
        </div>
      )}
    </>
  )
}