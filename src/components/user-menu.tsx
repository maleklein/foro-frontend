'use client'

import { useRouter } from 'next/navigation'
import { ChevronDown, LogOut } from 'lucide-react'
import { type SessionData, clearSessionCookie } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// Recibe los datos de la sesión para mostrar el nombre y el email del usuario
export function UserMenu({ session }: { session: SessionData }) {
  const router = useRouter()

  // Borra la cookie y manda al usuario a la pantalla de login
  function handleLogout() {
    clearSessionCookie()
    router.push('/login')
  }

  return (
    <DropdownMenu>

      {/* Botón que muestra el username del usuario y abre el dropdown.
          Usamos username porque es el dato que el BFF realmente expone
          (el backend Java no guarda fullName todavía). */}
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          {session.user.username}
          <ChevronDown className="size-4" />
        </Button>
      </DropdownMenuTrigger>

      {/* Lista desplegable */}
      <DropdownMenuContent align="end">

        {/* Info del usuario — solo texto, no se puede clickear */}
        <DropdownMenuLabel>
          <p className="font-medium">{session.user.username}</p>
          <p className="text-xs text-muted-foreground font-normal">{session.user.email}</p>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {/* Opción para cerrar sesión */}
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="size-4" />
          Cerrar sesión
        </DropdownMenuItem>

      </DropdownMenuContent>
    </DropdownMenu>
  )
}
