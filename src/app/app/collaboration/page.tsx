'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, Plus, UserCheck, MessageSquare } from 'lucide-react'

export default function CollaborationPage() {
  return (
    <div className="h-full p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Collaboration</h1>
          <p className="text-muted-foreground">
            Work together on document translations and reviews
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Invite Team Member
        </Button>
      </div>

      <div className="text-center py-12">
        <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">Collaboration Features Coming Soon</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          Share documents, collaborate on translations, and work together with your team in real-time.
        </p>
      </div>
    </div>
  )
}