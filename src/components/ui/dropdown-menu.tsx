"use client"

import * as React from "react"
import { DropdownMenu as DropdownMenuPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

// Contenedor general — controla si el dropdown está abierto o cerrado
function DropdownMenu({ ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.Root>) {
  return <DropdownMenuPrimitive.Root {...props} />
}

// El botón u elemento que abre el dropdown al hacer click
function DropdownMenuTrigger({ ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.Trigger>) {
  return <DropdownMenuPrimitive.Trigger {...props} />
}

// La lista desplegable con todas las opciones
function DropdownMenuContent({
  className,
  align = "end",
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Content>) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        align={align}
        className={cn(
          "z-50 min-w-48 rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-md",
          "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95",
          "data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
          className
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  )
}

// Un texto informativo dentro del dropdown — no es clickeable
function DropdownMenuLabel({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("px-2 py-1.5 text-sm", className)}
      {...props}
    />
  )
}

// Una opción clickeable del dropdown
function DropdownMenuItem({ className, ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.Item>) {
  return (
    <DropdownMenuPrimitive.Item
      className={cn(
        "relative flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none",
        "hover:bg-muted focus:bg-muted",
        "data-disabled:pointer-events-none data-disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

// Una línea divisoria entre grupos de opciones
function DropdownMenuSeparator({ className, ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.Separator>) {
  return (
    <DropdownMenuPrimitive.Separator
      className={cn("-mx-1 my-1 h-px bg-border", className)}
      {...props}
    />
  )
}

export {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
}
