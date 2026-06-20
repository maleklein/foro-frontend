import React from 'react'
import type { Metadata } from 'next'

// Título de pestaña para todas las pantallas de autenticación.
export const metadata: Metadata = {
  title: 'Iniciar sesión',
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-foreground">Foro UAP</h1>
          <p className="text-sm text-muted-foreground mt-1">Foro de discusión universitaria</p>
        </div>
        {children}
      </div>
    </div>
  )
}
