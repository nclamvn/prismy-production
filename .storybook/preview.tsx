import type { Preview } from '@storybook/react'
import React from 'react'
import '../src/app/globals.css'

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'light',
      values: [
        {
          name: 'light',
          value: '#ffffff',
        },
        {
          name: 'dark',
          value: '#1f2937',
        },
        {
          name: 'gray',
          value: '#f9fafb',
        },
      ],
    },
    viewport: {
      viewports: {
        mobile: {
          name: 'Mobile',
          styles: {
            width: '375px',
            height: '667px',
          },
        },
        tablet: {
          name: 'Tablet',
          styles: {
            width: '768px',
            height: '1024px',
          },
        },
        desktop: {
          name: 'Desktop',
          styles: {
            width: '1280px',
            height: '800px',
          },
        },
      },
    },
    a11y: {
      element: '#storybook-root',
      config: {},
      options: {},
      manual: true,
    },
    docs: {
      theme: {
        brandTitle: 'Prismy Design System',
        brandUrl: '/',
        brandImage: undefined,
        brandTarget: '_self',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="font-sans antialiased">
        <Story />
      </div>
    ),
  ],
  tags: ['autodocs'],
}

export default preview