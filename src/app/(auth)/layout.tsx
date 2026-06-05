import React from 'react'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
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
