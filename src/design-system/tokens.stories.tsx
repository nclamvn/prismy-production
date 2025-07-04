import type { Meta, StoryObj } from '@storybook/nextjs'
import { tokens } from './tokens'

const meta: Meta = {
  title: 'Design System/Tokens',
  parameters: {
    docs: {
      description: {
        component: 'Prismy Design System tokens showcase - colors, typography, spacing, and more.',
      },
    },
  },
}

export default meta
type Story = StoryObj

// Color Palette Stories
export const Colors: Story = {
  render: () => (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold mb-6">Color Palette</h2>
      
      {/* Primary Colors */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Primary Brand</h3>
        <div className="grid grid-cols-11 gap-2">
          {Object.entries(tokens.colors.primary).map(([scale, color]) => (
            <div key={scale} className="text-center">
              <div 
                className="w-16 h-16 rounded-lg border shadow-sm mb-2"
                style={{ backgroundColor: color }}
              />
              <div className="text-xs font-mono">{scale}</div>
              <div className="text-xs text-gray-500">{color}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Neutral Colors */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Neutral</h3>
        <div className="grid grid-cols-12 gap-2">
          {Object.entries(tokens.colors.neutral).map(([scale, color]) => (
            <div key={scale} className="text-center">
              <div 
                className="w-16 h-16 rounded-lg border shadow-sm mb-2"
                style={{ backgroundColor: color }}
              />
              <div className="text-xs font-mono">{scale}</div>
              <div className="text-xs text-gray-500">{color}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Semantic Colors */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Semantic Colors</h3>
        <div className="grid grid-cols-4 gap-6">
          {['success', 'warning', 'error', 'info'].map((semantic) => (
            <div key={semantic}>
              <h4 className="text-sm font-medium mb-2 capitalize">{semantic}</h4>
              <div className="grid grid-cols-5 gap-1">
                {Object.entries(tokens.colors[semantic as keyof typeof tokens.colors]).map(([scale, color]) => (
                  <div key={scale} className="text-center">
                    <div 
                      className="w-12 h-12 rounded border shadow-sm mb-1"
                      style={{ backgroundColor: color as string }}
                    />
                    <div className="text-xs font-mono">{scale}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  ),
}

// Typography Stories
export const Typography: Story = {
  render: () => (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold mb-6">Typography</h2>
      
      {/* Font Sizes */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Font Sizes</h3>
        <div className="space-y-4">
          {Object.entries(tokens.typography.fontSize).map(([size, [fontSize, { lineHeight }]]) => (
            <div key={size} className="flex items-baseline gap-4">
              <div className="w-12 text-xs text-gray-500 font-mono">{size}</div>
              <div style={{ fontSize, lineHeight }}>
                The quick brown fox jumps over the lazy dog
              </div>
              <div className="text-xs text-gray-400 font-mono ml-auto">
                {fontSize} / {lineHeight}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Font Weights */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Font Weights</h3>
        <div className="space-y-2">
          {Object.entries(tokens.typography.fontWeight).map(([weight, value]) => (
            <div key={weight} className="flex items-center gap-4">
              <div className="w-20 text-xs text-gray-500 font-mono">{weight}</div>
              <div style={{ fontWeight: value }} className="text-lg">
                The quick brown fox jumps over the lazy dog
              </div>
              <div className="text-xs text-gray-400 font-mono ml-auto">{value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  ),
}

// Spacing Stories  
export const Spacing: Story = {
  render: () => (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold mb-6">Spacing Scale</h2>
      
      <div className="space-y-4">
        {Object.entries(tokens.spacing).slice(0, 20).map(([scale, value]) => (
          <div key={scale} className="flex items-center gap-4">
            <div className="w-12 text-xs text-gray-500 font-mono">{scale}</div>
            <div 
              className="bg-blue-200 h-4"
              style={{ width: value }}
            />
            <div className="text-xs text-gray-400 font-mono">{value}</div>
          </div>
        ))}
      </div>
    </div>
  ),
}

// Border Radius Stories
export const BorderRadius: Story = {
  render: () => (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold mb-6">Border Radius</h2>
      
      <div className="grid grid-cols-4 gap-6">
        {Object.entries(tokens.borderRadius).map(([scale, value]) => (
          <div key={scale} className="text-center">
            <div 
              className="w-20 h-20 bg-blue-100 border-2 border-blue-300 mx-auto mb-2"
              style={{ borderRadius: value }}
            />
            <div className="text-sm font-medium">{scale}</div>
            <div className="text-xs text-gray-500 font-mono">{value}</div>
          </div>
        ))}
      </div>
    </div>
  ),
}

// Shadows Stories
export const Shadows: Story = {
  render: () => (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold mb-6">Box Shadows</h2>
      
      <div className="grid grid-cols-3 gap-6">
        {Object.entries(tokens.shadows).map(([scale, value]) => (
          <div key={scale} className="text-center">
            <div 
              className="w-20 h-20 bg-white border mx-auto mb-2"
              style={{ boxShadow: value }}
            />
            <div className="text-sm font-medium">{scale}</div>
            <div className="text-xs text-gray-500 font-mono break-all">{value}</div>
          </div>
        ))}
      </div>
    </div>
  ),
}