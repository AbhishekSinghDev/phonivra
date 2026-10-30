import { Component, type ErrorInfo, type ReactNode } from 'react'
import { StartupError } from './startup-error'

export class AppErrorBoundary extends Component<
  { children: ReactNode },
  { message: string | null }
> {
  state: { message: string | null } = { message: null }
  static getDerivedStateFromError(error: unknown): { message: string } {
    return {
      message: error instanceof Error ? error.message : 'Phonivra could not display this screen.'
    }
  }
  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Phonivra interface error:', error, info.componentStack)
  }
  render(): ReactNode {
    return this.state.message ? (
      <StartupError browser={false} message={this.state.message} />
    ) : (
      this.props.children
    )
  }
}
