import { forwardRef, useState } from 'react'
import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface TabsProps extends HTMLAttributes<HTMLDivElement> {
  defaultValue?: string
}

export const Tabs = forwardRef<HTMLDivElement, TabsProps>(
  ({ className, defaultValue = '', children, ...props }, ref) => {
    const [activeTab, setActiveTab] = useState(defaultValue)

    return (
      <div ref={ref} className={cn('w-full', className)} {...props} data-active-tab={activeTab}>
        {Array.isArray(children)
          ? children.map((child) => {
              if (typeof child === 'object' && child && 'props' in child) {
                return {
                  ...child,
                  props: {
                    ...child.props,
                    activeTab,
                    setActiveTab,
                  },
                }
              }
              return child
            })
          : children}
      </div>
    )
  }
)
Tabs.displayName = 'Tabs'

interface TabsListProps extends HTMLAttributes<HTMLDivElement> {}

export const TabsList = forwardRef<HTMLDivElement, TabsListProps>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground',
      className
    )}
    {...props}
  />
))
TabsList.displayName = 'TabsList'

interface TabsTriggerProps extends HTMLAttributes<HTMLButtonElement> {
  value: string
  activeTab?: string
  setActiveTab?: (value: string) => void
}

export const TabsTrigger = forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ className, value, activeTab, setActiveTab, ...props }, ref) => (
    <button
      ref={ref}
      onClick={() => setActiveTab?.(value)}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
        activeTab === value ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
      )}
      {...props}
    />
  )
)
TabsTrigger.displayName = 'TabsTrigger'

interface TabsContentProps extends HTMLAttributes<HTMLDivElement> {
  value: string
  activeTab?: string
}

export const TabsContent = forwardRef<HTMLDivElement, TabsContentProps>(
  ({ className, value, activeTab, ...props }, ref) => (
    <div ref={ref} className={cn(activeTab !== value ? 'hidden' : '', className)} {...props} />
  )
)
TabsContent.displayName = 'TabsContent'
