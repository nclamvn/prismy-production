import type { Preview } from '@storybook/nextjs'
import '../styles/globals.css'

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'default',
      values: [
        {
          name: 'default',
          value: '#FAFAFA', // bg-default
        },
        {
          name: 'surface',
          value: '#FFFFFF', // bg-surface
        },
        {
          name: 'muted',
          value: '#F5F5F5', // bg-muted
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
            width: '1440px',
            height: '900px',
          },
        },
      },
    },
    docs: {
      toc: true,
    },
  },
}

export default preview
