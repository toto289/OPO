
import * as React from "react"

import { cn } from "@/lib/utils"

const List = React.forwardRef<
  HTMLUListElement,
  React.HTMLAttributes<HTMLUListElement>
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    className={cn(
      "divide-y divide-border",
      className
    )}
    {...props}
  />
))
List.displayName = "List"

const ListItem = React.forwardRef<
  HTMLLIElement,
  React.HTMLAttributes<HTMLLIElement>
>(({ className, ...props }, ref) => (
  <li
    ref={ref}
    className={cn("flex items-center justify-between p-3", className)}
    {...props}
  />
))
ListItem.displayName = "ListItem"


export { List, ListItem }
