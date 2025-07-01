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
          name: 'tet-theme',
          value: '#fff8e1',
        },
        {
          name: 'vietnamese-red',
          value: '#da020e',
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
        vietnameseMobile: {
          name: 'Vietnamese Mobile',
          styles: {
            width: '375px',
            height: '812px',
          },
        },
      },
    },
    docs: {
      toc: true,
    },
  },
  globalTypes: {
    culturalTheme: {
      description: 'Vietnamese Cultural Theme',
      defaultValue: 'default',
      toolbar: {
        title: 'Cultural Theme',
        icon: 'globe',
        items: [
          { value: 'default', title: 'Default' },
          { value: 'tet', title: 'Tết Theme' },
          { value: 'traditional', title: 'Traditional' },
        ],
        dynamicTitle: true,
      },
    },
    locale: {
      description: 'Internationalization locale',
      defaultValue: 'vi',
      toolbar: {
        title: 'Locale',
        icon: 'globe',
        items: [
          { value: 'en', title: 'English' },
          { value: 'vi', title: 'Tiếng Việt' },
          { value: 'bilingual', title: 'Bilingual' },
        ],
        dynamicTitle: true,
      },
    },
  },
};

export default preview;