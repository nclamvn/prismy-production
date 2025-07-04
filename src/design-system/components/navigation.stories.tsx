import type { Meta, StoryObj } from '@storybook/nextjs'
import { 
  Navigation, 
  NavLink, 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbSeparator,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  SidebarNav,
  SidebarNavItem
} from './navigation'
import { 
  Home, 
  Settings, 
  Users, 
  FileText, 
  BarChart, 
  Bell, 
  Search
} from 'lucide-react'
import { Badge } from './badge'

const meta: Meta<typeof Navigation> = {
  title: 'Design System/Navigation',
  component: Navigation,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Navigation components including nav links, breadcrumbs, tabs, and sidebar navigation. Fully accessible with ARIA support.',
      },
    },
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof Navigation>

// Basic Navigation
export const HorizontalNav: Story = {
  render: () => (
    <Navigation>
      <NavLink href="/" icon={<Home className="h-4 w-4" />} active>
        Home
      </NavLink>
      <NavLink href="/about">About</NavLink>
      <NavLink href="/services">Services</NavLink>
      <NavLink href="/contact">Contact</NavLink>
    </Navigation>
  ),
}

export const VerticalNav: Story = {
  render: () => (
    <div className="w-48">
      <Navigation orientation="vertical">
        <NavLink href="/" icon={<Home className="h-4 w-4" />} active>
          Dashboard
        </NavLink>
        <NavLink href="/users" icon={<Users className="h-4 w-4" />}>
          Users
        </NavLink>
        <NavLink href="/documents" icon={<FileText className="h-4 w-4" />}>
          Documents
        </NavLink>
        <NavLink href="/analytics" icon={<BarChart className="h-4 w-4" />}>
          Analytics
        </NavLink>
        <NavLink href="/settings" icon={<Settings className="h-4 w-4" />}>
          Settings
        </NavLink>
      </Navigation>
    </div>
  ),
}

// Navigation with Badges
export const NavWithBadges: Story = {
  render: () => (
    <Navigation>
      <NavLink href="/" icon={<Home className="h-4 w-4" />} active>
        Home
      </NavLink>
      <NavLink 
        href="/notifications" 
        icon={<Bell className="h-4 w-4" />}
        badge={<Badge variant="destructive" size="sm">3</Badge>}
      >
        Notifications
      </NavLink>
      <NavLink 
        href="/messages" 
        icon={<Search className="h-4 w-4" />}
        badge={<Badge variant="secondary" size="sm">12</Badge>}
      >
        Messages
      </NavLink>
    </Navigation>
  ),
}

// Breadcrumb Navigation
export const BreadcrumbNav: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Simple Breadcrumb</h3>
        <Breadcrumb>
          <BreadcrumbItem href="/" icon={<Home className="h-4 w-4" />}>
            Home
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem href="/projects">Projects</BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem active>Current Project</BreadcrumbItem>
        </Breadcrumb>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2">Long Breadcrumb</h3>
        <Breadcrumb>
          <BreadcrumbItem href="/" icon={<Home className="h-4 w-4" />}>
            Home
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem href="/workspace">Workspace</BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem href="/projects">Projects</BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem href="/project/123">Project Alpha</BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem href="/project/123/documents">Documents</BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem active>Annual Report 2024</BreadcrumbItem>
        </Breadcrumb>
      </div>
    </div>
  ),
}

// Tabs Navigation
export const TabsNav: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold mb-4">Horizontal Tabs</h3>
        <Tabs>
          <TabsList>
            <TabsTrigger value="overview" active>Overview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" active>
            <div className="p-6 border rounded-lg">
              <h4 className="font-semibold mb-2">Overview Content</h4>
              <p className="text-neutral-600">This is the overview tab content.</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Vertical Tabs</h3>
        <Tabs orientation="vertical">
          <TabsList orientation="vertical">
            <TabsTrigger value="general" active>General</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
          </TabsList>
          <TabsContent value="general" active>
            <div className="p-6 border rounded-lg">
              <h4 className="font-semibold mb-2">General Settings</h4>
              <p className="text-neutral-600">Configure your general account settings here.</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  ),
}

// Sidebar Navigation
export const SidebarNavigation: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Expanded Sidebar</h3>
        <div className="bg-neutral-50 border rounded-lg">
          <SidebarNav>
            <SidebarNavItem href="/" icon={<Home className="h-4 w-4" />} active>
              Dashboard
            </SidebarNavItem>
            <SidebarNavItem href="/users" icon={<Users className="h-4 w-4" />}>
              Users
            </SidebarNavItem>
            <SidebarNavItem 
              href="/documents" 
              icon={<FileText className="h-4 w-4" />}
              badge={<Badge variant="secondary" size="sm">24</Badge>}
            >
              Documents
            </SidebarNavItem>
            <SidebarNavItem href="/analytics" icon={<BarChart className="h-4 w-4" />}>
              Analytics
            </SidebarNavItem>
            <SidebarNavItem 
              href="/notifications" 
              icon={<Bell className="h-4 w-4" />}
              badge={<Badge variant="destructive" size="sm">3</Badge>}
            >
              Notifications
            </SidebarNavItem>
            <SidebarNavItem href="/settings" icon={<Settings className="h-4 w-4" />}>
              Settings
            </SidebarNavItem>
          </SidebarNav>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Collapsed Sidebar</h3>
        <div className="bg-neutral-50 border rounded-lg">
          <SidebarNav>
            <SidebarNavItem href="/" icon={<Home className="h-4 w-4" />} active collapsed>
              Dashboard
            </SidebarNavItem>
            <SidebarNavItem href="/users" icon={<Users className="h-4 w-4" />} collapsed>
              Users
            </SidebarNavItem>
            <SidebarNavItem href="/documents" icon={<FileText className="h-4 w-4" />} collapsed>
              Documents
            </SidebarNavItem>
            <SidebarNavItem href="/analytics" icon={<BarChart className="h-4 w-4" />} collapsed>
              Analytics
            </SidebarNavItem>
            <SidebarNavItem href="/notifications" icon={<Bell className="h-4 w-4" />} collapsed>
              Notifications
            </SidebarNavItem>
            <SidebarNavItem href="/settings" icon={<Settings className="h-4 w-4" />} collapsed>
              Settings
            </SidebarNavItem>
          </SidebarNav>
        </div>
      </div>
    </div>
  ),
}

// Kitchen Sink - All Navigation Components
export const KitchenSink: Story = {
  render: () => (
    <div className="space-y-8 p-6 max-w-6xl">
      <div>
        <h2 className="text-2xl font-bold mb-6">Navigation Components</h2>
        
        {/* Breadcrumb */}
        <div className="mb-6">
          <Breadcrumb>
            <BreadcrumbItem href="/" icon={<Home className="h-4 w-4" />}>
              Home
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem href="/components">Components</BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem active>Navigation</BreadcrumbItem>
          </Breadcrumb>
        </div>

        {/* Main Navigation */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Main Navigation</h3>
          <Navigation variant="underline">
            <NavLink href="/" active>Home</NavLink>
            <NavLink href="/components">Components</NavLink>
            <NavLink href="/docs">Documentation</NavLink>
            <NavLink href="/examples">Examples</NavLink>
          </Navigation>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Tab Navigation</h3>
          <Tabs>
            <TabsList>
              <TabsTrigger value="preview" active>Preview</TabsTrigger>
              <TabsTrigger value="code">Code</TabsTrigger>
              <TabsTrigger value="docs">Documentation</TabsTrigger>
            </TabsList>
            <TabsContent value="preview" active>
              <div className="p-4 border rounded-lg bg-neutral-50">
                <p className="text-sm text-neutral-600">Component preview content</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar Navigation */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Sidebar Navigation</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-neutral-50 border rounded-lg">
              <SidebarNav>
                <SidebarNavItem href="/" icon={<Home className="h-4 w-4" />} active>
                  Dashboard
                </SidebarNavItem>
                <SidebarNavItem href="/users" icon={<Users className="h-4 w-4" />}>
                  Users
                </SidebarNavItem>
                <SidebarNavItem 
                  href="/documents" 
                  icon={<FileText className="h-4 w-4" />}
                  badge={<Badge variant="secondary" size="sm">24</Badge>}
                >
                  Documents
                </SidebarNavItem>
                <SidebarNavItem href="/analytics" icon={<BarChart className="h-4 w-4" />}>
                  Analytics
                </SidebarNavItem>
              </SidebarNav>
            </div>
            <div className="bg-neutral-50 border rounded-lg">
              <SidebarNav>
                <SidebarNavItem href="/" icon={<Home className="h-4 w-4" />} active collapsed>
                  Dashboard
                </SidebarNavItem>
                <SidebarNavItem href="/users" icon={<Users className="h-4 w-4" />} collapsed>
                  Users
                </SidebarNavItem>
                <SidebarNavItem href="/documents" icon={<FileText className="h-4 w-4" />} collapsed>
                  Documents
                </SidebarNavItem>
                <SidebarNavItem href="/analytics" icon={<BarChart className="h-4 w-4" />} collapsed>
                  Analytics
                </SidebarNavItem>
              </SidebarNav>
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
}