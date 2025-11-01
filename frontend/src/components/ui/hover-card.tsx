import * as React from "react"
import * as HoverCardPrimitive from "@radix-ui/react-hover-card"
import * as PopoverPrimitive from "@radix-ui/react-popover"
import { useIsMobile } from "@/hooks/use-mobile"

import { cn } from "@/lib/utils"

const HoverCardContext = React.createContext<{ isMobile: boolean }>({ isMobile: false })

type HoverCardProps = React.ComponentPropsWithoutRef<typeof HoverCardPrimitive.Root>

function HoverCard({
  openDelay = 200,
  closeDelay = 300,
  ...props
}: HoverCardProps) {
  const isMobile = useIsMobile()
  
  // On mobile, use Popover instead of HoverCard for click support
  if (isMobile) {
    return (
      <HoverCardContext.Provider value={{ isMobile }}>
        <PopoverPrimitive.Root {...(props as any)} />
      </HoverCardContext.Provider>
    )
  }
  
  return (
    <HoverCardContext.Provider value={{ isMobile }}>
      <HoverCardPrimitive.Root 
        data-slot="hover-card" 
        openDelay={openDelay}
        closeDelay={closeDelay}
        {...props} 
      />
    </HoverCardContext.Provider>
  )
}

type HoverCardTriggerProps = React.ComponentPropsWithoutRef<typeof HoverCardPrimitive.Trigger>

function HoverCardTrigger({
  ...props
}: HoverCardTriggerProps) {
  const { isMobile } = React.useContext(HoverCardContext)
  
  // On mobile, use Popover trigger
  if (isMobile) {
    return <PopoverPrimitive.Trigger {...(props as any)} />
  }
  
  return (
    <HoverCardPrimitive.Trigger data-slot="hover-card-trigger" {...props} />
  )
}

type HoverCardContentProps = React.ComponentPropsWithoutRef<typeof HoverCardPrimitive.Content>

function HoverCardContent({
  className,
  align = "center",
  sideOffset = 4,
  ...props
}: HoverCardContentProps) {
  const { isMobile } = React.useContext(HoverCardContext)
  
  const contentClassName = cn(
    "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-64 origin-(--radix-hover-card-content-transform-origin) rounded-md border p-4 shadow-md outline-hidden",
    className
  )
  
  // On mobile, use Popover content
  if (isMobile) {
    return (
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align={align}
          sideOffset={sideOffset}
          className={contentClassName}
          {...(props as any)}
        />
      </PopoverPrimitive.Portal>
    )
  }
  
  return (
    <HoverCardPrimitive.Portal data-slot="hover-card-portal">
      <HoverCardPrimitive.Content
        data-slot="hover-card-content"
        align={align}
        sideOffset={sideOffset}
        className={contentClassName}
        {...props}
      />
    </HoverCardPrimitive.Portal>
  )
}

export { HoverCard, HoverCardTrigger, HoverCardContent }
