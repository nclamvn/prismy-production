/// <reference types="jest" />
/// <reference types="@testing-library/jest-dom" />

import '@testing-library/jest-dom'

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R
      toHaveClass(className: string): R
      toHaveTextContent(text: string): R
      toBeVisible(): R
      toBeDisabled(): R
      toBeEnabled(): R
      toHaveValue(value: string | number): R
      toHaveDisplayValue(value: string): R
      toBeChecked(): R
      toHaveFocus(): R
      toHaveAttribute(attr: string, value?: string): R
      toHaveStyle(css: Record<string, any> | string): R
      toContainElement(element: HTMLElement | null): R
      toContainHTML(htmlText: string): R
      toHaveDescription(text: string): R
      toHaveErrorMessage(text: string): R
    }
  }
}
