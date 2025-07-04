import type { Meta, StoryObj } from '@storybook/nextjs'
import { 
  Form, 
  FormField, 
  FormLabel, 
  FormMessage, 
  FormSection,
  FormGrid,
  Fieldset,
  Select,
  Checkbox,
  Radio,
  RadioGroup
} from './form'
import { Input, Textarea } from './input'
import { Button } from './button'
import { User, Mail, Phone, Building, MapPin } from 'lucide-react'

const meta: Meta<typeof Form> = {
  title: 'Design System/Form',
  component: Form,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Comprehensive form components with validation, accessibility, and flexible layouts. Includes form fields, labels, messages, and various input types.',
      },
    },
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof Form>

// Basic Form
export const BasicForm: Story = {
  render: () => (
    <Form className="max-w-md">
      <FormField>
        <FormLabel htmlFor="name" required>Full Name</FormLabel>
        <Input id="name" name="name" placeholder="Enter your full name" />
      </FormField>

      <FormField>
        <FormLabel htmlFor="email" required>Email</FormLabel>
        <Input 
          id="email" 
          name="email" 
          type="email" 
          placeholder="Enter your email"
          leftIcon={<Mail className="h-4 w-4" />}
        />
      </FormField>

      <FormField>
        <FormLabel htmlFor="phone">Phone Number</FormLabel>
        <Input 
          id="phone" 
          name="phone" 
          type="tel" 
          placeholder="(555) 123-4567"
          leftIcon={<Phone className="h-4 w-4" />}
        />
        <FormMessage helperText="Optional: We'll only use this for important updates" />
      </FormField>

      <Button type="submit" className="w-full">
        Submit
      </Button>
    </Form>
  ),
}

// Form with Validation
export const FormWithValidation: Story = {
  render: () => (
    <Form className="max-w-md">
      <FormField error="Please enter your full name">
        <FormLabel htmlFor="name-error" required>Full Name</FormLabel>
        <Input 
          id="name-error" 
          name="name" 
          variant="error"
          placeholder="Enter your full name"
        />
      </FormField>

      <FormField success="Email format is valid">
        <FormLabel htmlFor="email-success" required>Email</FormLabel>
        <Input 
          id="email-success" 
          name="email" 
          variant="success"
          value="user@example.com"
          leftIcon={<Mail className="h-4 w-4" />}
        />
      </FormField>

      <FormField>
        <FormLabel htmlFor="password" required>Password</FormLabel>
        <Input 
          id="password" 
          name="password" 
          type="password" 
          placeholder="Enter your password"
        />
        <FormMessage helperText="Must be at least 8 characters with numbers and symbols" />
      </FormField>

      <Button type="submit" className="w-full">
        Create Account
      </Button>
    </Form>
  ),
}

// Form with Sections
export const FormWithSections: Story = {
  render: () => (
    <Form className="max-w-2xl">
      <FormSection 
        title="Personal Information" 
        description="Please provide your personal details"
      >
        <FormGrid cols={2}>
          <FormField>
            <FormLabel htmlFor="firstName" required>First Name</FormLabel>
            <Input id="firstName" name="firstName" placeholder="John" />
          </FormField>

          <FormField>
            <FormLabel htmlFor="lastName" required>Last Name</FormLabel>
            <Input id="lastName" name="lastName" placeholder="Doe" />
          </FormField>
        </FormGrid>

        <FormField>
          <FormLabel htmlFor="email-section" required>Email Address</FormLabel>
          <Input 
            id="email-section" 
            name="email" 
            type="email" 
            placeholder="john.doe@example.com"
            leftIcon={<Mail className="h-4 w-4" />}
          />
        </FormField>
      </FormSection>

      <FormSection 
        title="Address Information" 
        description="Where should we send your orders?"
        collapsible
      >
        <FormField>
          <FormLabel htmlFor="address" required>Street Address</FormLabel>
          <Input 
            id="address" 
            name="address" 
            placeholder="123 Main Street"
            leftIcon={<MapPin className="h-4 w-4" />}
          />
        </FormField>

        <FormGrid cols={3}>
          <FormField>
            <FormLabel htmlFor="city" required>City</FormLabel>
            <Input id="city" name="city" placeholder="New York" />
          </FormField>

          <FormField>
            <FormLabel htmlFor="state" required>State</FormLabel>
            <Select
              id="state"
              name="state"
              placeholder="Select state"
              options={[
                { value: 'ny', label: 'New York' },
                { value: 'ca', label: 'California' },
                { value: 'tx', label: 'Texas' },
                { value: 'fl', label: 'Florida' },
              ]}
            />
          </FormField>

          <FormField>
            <FormLabel htmlFor="zip" required>ZIP Code</FormLabel>
            <Input id="zip" name="zip" placeholder="10001" />
          </FormField>
        </FormGrid>
      </FormSection>

      <Button type="submit" className="w-full">
        Save Information
      </Button>
    </Form>
  ),
}

// Form with Different Input Types
export const FormInputTypes: Story = {
  render: () => (
    <Form className="max-w-lg space-y-6">
      {/* Text Inputs */}
      <FormSection title="Text Inputs">
        <FormField>
          <FormLabel htmlFor="text-input">Text Input</FormLabel>
          <Input id="text-input" name="text" placeholder="Enter text" />
        </FormField>

        <FormField>
          <FormLabel htmlFor="email-input">Email Input</FormLabel>
          <Input 
            id="email-input" 
            name="email" 
            type="email" 
            placeholder="email@example.com"
            leftIcon={<Mail className="h-4 w-4" />}
          />
        </FormField>

        <FormField>
          <FormLabel htmlFor="textarea-input">Textarea</FormLabel>
          <Textarea 
            id="textarea-input" 
            name="message" 
            placeholder="Enter your message..."
            rows={4}
          />
        </FormField>
      </FormSection>

      {/* Select */}
      <FormSection title="Select Options">
        <FormField>
          <FormLabel htmlFor="country">Country</FormLabel>
          <Select
            id="country"
            name="country"
            placeholder="Select your country"
            options={[
              { value: 'us', label: 'United States' },
              { value: 'ca', label: 'Canada' },
              { value: 'uk', label: 'United Kingdom' },
              { value: 'de', label: 'Germany' },
            ]}
          />
        </FormField>
      </FormSection>

      {/* Checkboxes */}
      <FormSection title="Checkboxes">
        <FormField>
          <Checkbox 
            name="newsletter" 
            label="Subscribe to newsletter"
            description="Get updates about new features and releases"
          />
        </FormField>
        
        <FormField>
          <Checkbox 
            name="terms" 
            label="I agree to the terms and conditions"
            required
          />
        </FormField>
      </FormSection>

      {/* Radio Buttons */}
      <FormSection title="Radio Buttons">
        <FormField>
          <FormLabel>Preferred Contact Method</FormLabel>
          <RadioGroup name="contact-method" orientation="vertical">
            <Radio value="email" label="Email" description="We'll send updates to your email" />
            <Radio value="phone" label="Phone" description="We'll call you with updates" />
            <Radio value="sms" label="SMS" description="We'll text you important updates" />
          </RadioGroup>
        </FormField>
      </FormSection>

      <Button type="submit" className="w-full">
        Submit Form
      </Button>
    </Form>
  ),
}

// Form with Fieldsets
export const FormWithFieldsets: Story = {
  render: () => (
    <Form className="max-w-2xl">
      <Fieldset legend="Personal Information">
        <FormGrid cols={2}>
          <FormField>
            <FormLabel htmlFor="first-name" required>First Name</FormLabel>
            <Input id="first-name" name="firstName" />
          </FormField>

          <FormField>
            <FormLabel htmlFor="last-name" required>Last Name</FormLabel>
            <Input id="last-name" name="lastName" />
          </FormField>
        </FormGrid>

        <FormField>
          <FormLabel htmlFor="bio">Bio</FormLabel>
          <Textarea id="bio" name="bio" placeholder="Tell us about yourself..." />
        </FormField>
      </Fieldset>

      <Fieldset legend="Account Preferences">
        <FormField>
          <FormLabel>Notification Preferences</FormLabel>
          <RadioGroup name="notifications">
            <Radio value="all" label="All notifications" />
            <Radio value="important" label="Important only" />
            <Radio value="none" label="No notifications" />
          </RadioGroup>
        </FormField>

        <FormField>
          <Checkbox 
            name="two-factor" 
            label="Enable two-factor authentication"
            description="Add an extra layer of security to your account"
          />
        </FormField>
      </Fieldset>

      <Button type="submit">Save Settings</Button>
    </Form>
  ),
}

// Inline Form
export const InlineForm: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Newsletter Signup</h3>
        <Form variant="inline">
          <FormField>
            <Input 
              name="email" 
              type="email" 
              placeholder="Enter your email"
              className="min-w-[200px]"
            />
          </FormField>
          <Button type="submit">Subscribe</Button>
        </Form>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Search</h3>
        <Form variant="inline">
          <FormField>
            <Input 
              name="query" 
              placeholder="Search..."
              className="min-w-[300px]"
            />
          </FormField>
          <FormField>
            <Select
              name="category"
              options={[
                { value: 'all', label: 'All Categories' },
                { value: 'docs', label: 'Documentation' },
                { value: 'components', label: 'Components' },
              ]}
            />
          </FormField>
          <Button type="submit">Search</Button>
        </Form>
      </div>
    </div>
  ),
}

// Kitchen Sink - Complete Form Example
export const KitchenSink: Story = {
  render: () => (
    <div className="space-y-8 p-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold mb-2">Form Components</h2>
        <p className="text-neutral-600 mb-6">
          Comprehensive form system with validation, accessibility, and flexible layouts.
        </p>
      </div>

      <Form variant="card">
        <FormSection 
          title="Account Setup" 
          description="Create your new account with the information below"
        >
          <FormGrid cols={2}>
            <FormField>
              <FormLabel htmlFor="first" required>First Name</FormLabel>
              <Input 
                id="first" 
                name="firstName" 
                placeholder="John"
                leftIcon={<User className="h-4 w-4" />}
              />
            </FormField>

            <FormField>
              <FormLabel htmlFor="last" required>Last Name</FormLabel>
              <Input 
                id="last" 
                name="lastName" 
                placeholder="Doe"
                leftIcon={<User className="h-4 w-4" />}
              />
            </FormField>
          </FormGrid>

          <FormField>
            <FormLabel htmlFor="email-main" required>Email Address</FormLabel>
            <Input 
              id="email-main" 
              name="email" 
              type="email" 
              placeholder="john.doe@company.com"
              leftIcon={<Mail className="h-4 w-4" />}
            />
            <FormMessage helperText="We'll use this for login and notifications" />
          </FormField>

          <FormField>
            <FormLabel htmlFor="company">Company</FormLabel>
            <Input 
              id="company" 
              name="company" 
              placeholder="Acme Corp"
              leftIcon={<Building className="h-4 w-4" />}
            />
          </FormField>
        </FormSection>

        <FormSection title="Preferences">
          <FormField>
            <FormLabel>Account Type</FormLabel>
            <RadioGroup name="accountType" orientation="horizontal">
              <Radio value="personal" label="Personal" />
              <Radio value="business" label="Business" />
              <Radio value="enterprise" label="Enterprise" />
            </RadioGroup>
          </FormField>

          <FormField>
            <FormLabel htmlFor="timezone">Timezone</FormLabel>
            <Select
              id="timezone"
              name="timezone"
              placeholder="Select your timezone"
              options={[
                { value: 'pst', label: 'Pacific Standard Time (PST)' },
                { value: 'mst', label: 'Mountain Standard Time (MST)' },
                { value: 'cst', label: 'Central Standard Time (CST)' },
                { value: 'est', label: 'Eastern Standard Time (EST)' },
              ]}
            />
          </FormField>

          <div className="space-y-3">
            <FormLabel>Communication Preferences</FormLabel>
            <Checkbox 
              name="marketing" 
              label="Marketing emails"
              description="Product updates, new features, and special offers"
            />
            <Checkbox 
              name="security" 
              label="Security notifications"
              description="Account security and login alerts"
            />
            <Checkbox 
              name="newsletter" 
              label="Monthly newsletter"
              description="Industry insights and best practices"
            />
          </div>
        </FormSection>

        <FormSection title="Additional Information" collapsible defaultCollapsed>
          <FormField>
            <FormLabel htmlFor="bio">Bio</FormLabel>
            <Textarea 
              id="bio" 
              name="bio" 
              placeholder="Tell us about yourself and your role..."
              rows={4}
            />
          </FormField>

          <FormGrid cols={2}>
            <FormField>
              <FormLabel htmlFor="website">Website</FormLabel>
              <Input 
                id="website" 
                name="website" 
                type="url" 
                placeholder="https://yourwebsite.com"
              />
            </FormField>

            <FormField>
              <FormLabel htmlFor="linkedin">LinkedIn</FormLabel>
              <Input 
                id="linkedin" 
                name="linkedin" 
                type="url" 
                placeholder="https://linkedin.com/in/yourname"
              />
            </FormField>
          </FormGrid>
        </FormSection>

        <div className="flex gap-3 pt-4">
          <Button type="submit" className="flex-1">
            Create Account
          </Button>
          <Button variant="outline" type="button">
            Cancel
          </Button>
        </div>
      </Form>
    </div>
  ),
}