import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppLayout } from '@/components/layout/app-layout'
import { CollaborativeEditor } from '@/components/collaboration/collaborative-editor'
import { PresenceIndicators } from '@/components/collaboration/presence-indicators'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Users, FileText, Zap, Shield, Globe, MessageSquare } from 'lucide-react'

export default async function CollaborationPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // In a real app, this would come from the database
  const mockDocument = {
    id: 'demo-doc-001',
    title: 'Collaboration Demo Document',
    content: `Welcome to the real-time collaboration demo!

This document supports multiple users editing simultaneously:
- See other users' cursors in real-time
- Watch text changes as they happen
- View who's currently active
- Auto-save functionality

Try opening this page in multiple browser windows to see collaboration in action!`,
  }

  return (
    <AppLayout userEmail={user.email}>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Real-time Collaboration</h1>
            <p className="text-muted-foreground">
              Work together on documents with live presence and instant updates
            </p>
          </div>
          <Badge variant="secondary" className="text-sm">
            <Zap className="h-3 w-3 mr-1" />
            Day 9 Feature
          </Badge>
        </div>

        {/* Feature Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-4 w-4" />
                Live Presence
              </CardTitle>
              <CardDescription>
                See who&apos;s viewing and editing documents in real-time with color-coded avatars
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4" />
                Instant Sync
              </CardTitle>
              <CardDescription>
                Changes sync across all users instantly using WebSocket connections
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Shield className="h-4 w-4" />
                Conflict Resolution
              </CardTitle>
              <CardDescription>
                Smart conflict resolution ensures no work is lost during simultaneous edits
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Main Collaboration Area */}
        <Tabs defaultValue="editor" className="space-y-4">
          <TabsList>
            <TabsTrigger value="editor">
              <FileText className="h-4 w-4 mr-2" />
              Document Editor
            </TabsTrigger>
            <TabsTrigger value="presence">
              <Users className="h-4 w-4 mr-2" />
              Presence Demo
            </TabsTrigger>
            <TabsTrigger value="activity">
              <Globe className="h-4 w-4 mr-2" />
              Activity Feed
            </TabsTrigger>
          </TabsList>

          <TabsContent value="editor" className="space-y-4">
            <CollaborativeEditor
              documentId={mockDocument.id}
              initialContent={mockDocument.content}
              onSave={async (content) => {
                // In a real app, this would save to the database
                console.log('Saving document:', content)
              }}
            />
          </TabsContent>

          <TabsContent value="presence" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Presence Indicators Demo</CardTitle>
                <CardDescription>
                  Different ways to display active users in your application
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium mb-3">Small Size</h4>
                  <PresenceIndicators users={[]} size="sm" />
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-3">Medium Size (Default)</h4>
                  <PresenceIndicators
                    users={[
                      {
                        userId: '1',
                        email: 'alice@example.com',
                        displayName: 'Alice Chen',
                        status: 'online',
                        lastSeen: new Date().toISOString(),
                        color: '#FF6B6B'
                      },
                      {
                        userId: '2',
                        email: 'bob@example.com',
                        displayName: 'Bob Smith',
                        status: 'idle',
                        lastSeen: new Date().toISOString(),
                        color: '#4ECDC4'
                      }
                    ]}
                  />
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-3">Large Size with Many Users</h4>
                  <PresenceIndicators
                    users={[
                      {
                        userId: '1',
                        email: 'alice@example.com',
                        displayName: 'Alice Chen',
                        status: 'online',
                        lastSeen: new Date().toISOString(),
                        color: '#FF6B6B'
                      },
                      {
                        userId: '2',
                        email: 'bob@example.com',
                        displayName: 'Bob Smith',
                        status: 'online',
                        lastSeen: new Date().toISOString(),
                        color: '#4ECDC4'
                      },
                      {
                        userId: '3',
                        email: 'charlie@example.com',
                        displayName: 'Charlie Davis',
                        status: 'online',
                        lastSeen: new Date().toISOString(),
                        color: '#45B7D1'
                      },
                      {
                        userId: '4',
                        email: 'diana@example.com',
                        displayName: 'Diana Evans',
                        status: 'idle',
                        lastSeen: new Date().toISOString(),
                        color: '#F7B731'
                      },
                      {
                        userId: '5',
                        email: 'eric@example.com',
                        displayName: 'Eric Foster',
                        status: 'online',
                        lastSeen: new Date().toISOString(),
                        color: '#5F27CD'
                      },
                      {
                        userId: '6',
                        email: 'fiona@example.com',
                        status: 'online',
                        lastSeen: new Date().toISOString(),
                        color: '#00D2D3'
                      },
                      {
                        userId: '7',
                        email: 'george@example.com',
                        status: 'online',
                        lastSeen: new Date().toISOString(),
                        color: '#FF9FF3'
                      }
                    ]}
                    size="lg"
                    maxDisplay={5}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Activity Feed</CardTitle>
                <CardDescription>
                  Real-time activity from all collaborators
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { user: 'Alice Chen', action: 'started editing', time: '2 minutes ago', icon: '✏️' },
                    { user: 'Bob Smith', action: 'joined the document', time: '5 minutes ago', icon: '👋' },
                    { user: 'You', action: 'saved changes', time: '10 minutes ago', icon: '💾' },
                    { user: 'Charlie Davis', action: 'left a comment', time: '15 minutes ago', icon: '💬' },
                    { user: 'Diana Evans', action: 'went idle', time: '20 minutes ago', icon: '😴' },
                  ].map((activity, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="text-2xl">{activity.icon}</div>
                      <div className="flex-1">
                        <p className="text-sm">
                          <span className="font-medium">{activity.user}</span>{' '}
                          <span className="text-muted-foreground">{activity.action}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Technical Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              How It Works
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none text-muted-foreground">
            <p>
              This real-time collaboration system uses Supabase Realtime channels for WebSocket communication:
            </p>
            <ul className="space-y-1">
              <li>• <strong>Presence tracking</strong> - User status and cursor positions</li>
              <li>• <strong>Broadcast events</strong> - Text changes and selections</li>
              <li>• <strong>Conflict-free replicated data types (CRDTs)</strong> - For operational transformation</li>
              <li>• <strong>Auto-save with debouncing</strong> - Saves changes after 1 second of inactivity</li>
              <li>• <strong>Color-coded users</strong> - Consistent colors based on user ID</li>
            </ul>
          </CardContent>
        </Card>

        {/* Status */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary rounded-full">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">Day 9 - Real-time Collaboration Active</span>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}