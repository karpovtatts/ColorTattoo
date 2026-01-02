import { ReactNode } from 'react'
import './Container.css'

interface ContainerProps {
  children: ReactNode
  className?: string
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
}

function Container({ children, className = '', maxWidth = 'lg' }: ContainerProps) {
  const classes = ['container', `container--${maxWidth}`, className]
    .filter(Boolean)
    .join(' ')

  return <div className={classes}>{children}</div>
}

export default Container

