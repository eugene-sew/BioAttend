# UI Components Library

A comprehensive set of reusable UI components built with React and styled with Tailwind CSS. All components support dark mode, are fully responsive, and follow accessibility best practices.

## Features

- 🌗 **Dark/Light Theme Support** - All components work seamlessly in both light and dark modes
- 📱 **Mobile Responsive** - Components adapt to all screen sizes using Tailwind's responsive utilities
- ♿ **Accessible** - Built with ARIA attributes and keyboard navigation support
- 🎨 **Customizable** - Easy to customize with Tailwind classes and component props
- 🚀 **Performance** - Optimized for performance with React best practices

## Components

### Button
A versatile button component with multiple variants, sizes, and states.

```jsx
import { Button } from '../components/ui';

// Variants
<Button variant="primary">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="success">Success</Button>
<Button variant="danger">Danger</Button>
<Button variant="warning">Warning</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="outline">Outline</Button>

// Sizes
<Button size="xs">Extra Small</Button>
<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>
<Button size="xl">Extra Large</Button>

// States
<Button disabled>Disabled</Button>
<Button loading>Loading</Button>
<Button fullWidth>Full Width</Button>
```

### Input
Form input components including text input, textarea, and select.

```jsx
import { Input, Textarea, Select } from '../components/ui';

// Text Input
<Input
  label="Email"
  type="email"
  placeholder="Enter email"
  error="Invalid email"
  helperText="We'll never share your email"
/>

// Textarea
<Textarea
  label="Message"
  rows={4}
  placeholder="Enter your message"
/>

// Select
<Select label="Country">
  <option value="">Select a country</option>
  <option value="us">United States</option>
  <option value="uk">United Kingdom</option>
</Select>
```

### Modal
A flexible modal dialog component.

```jsx
import { Modal, Button } from '../components/ui';

const [isOpen, setIsOpen] = useState(false);

<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Modal Title"
  size="md" // xs, sm, md, lg, xl, 2xl, 3xl, 4xl, full
  footer={
    <>
      <Button variant="ghost" onClick={() => setIsOpen(false)}>
        Cancel
      </Button>
      <Button onClick={() => setIsOpen(false)}>
        Save
      </Button>
    </>
  }
>
  Modal content goes here
</Modal>
```

### Table
Responsive table components with pagination.

```jsx
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TablePagination
} from '../components/ui';

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Email</TableHead>
      <TableHead>Role</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>John Doe</TableCell>
      <TableCell>john@example.com</TableCell>
      <TableCell>Admin</TableCell>
    </TableRow>
  </TableBody>
</Table>

<TablePagination
  currentPage={1}
  totalPages={10}
  onPageChange={setPage}
  itemsPerPage={10}
  totalItems={100}
/>
```

### Card
Flexible card components for content organization.

```jsx
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  StatsCard
} from '../components/ui';

// Basic Card
<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description</CardDescription>
  </CardHeader>
  <CardContent>
    Card content
  </CardContent>
  <CardFooter>
    Card footer
  </CardFooter>
</Card>

// Stats Card
<StatsCard
  title="Total Users"
  value="1,234"
  description="All registered users"
  trend="up"
  trendValue="+12.5%"
/>
```

### Avatar
User avatar components with status indicators.

```jsx
import { Avatar, AvatarGroup } from '../components/ui';

// Single Avatar
<Avatar name="John Doe" size="md" />
<Avatar src="/path/to/image.jpg" alt="User" />
<Avatar name="Jane Smith" status="online" />

// Avatar Group
<AvatarGroup max={3}>
  <Avatar name="User 1" />
  <Avatar name="User 2" />
  <Avatar name="User 3" />
  <Avatar name="User 4" />
</AvatarGroup>
```

### Badge
Badge component for labels and status indicators.

```jsx
import { Badge } from '../components/ui';

<Badge variant="primary">Primary</Badge>
<Badge variant="success" size="sm">Active</Badge>
<Badge variant="danger" removable onRemove={handleRemove}>
  Removable
</Badge>
```

### Dropdown
Dropdown menu component.

```jsx
import { Dropdown, DropdownItem, DropdownDivider, Button } from '../components/ui';

<Dropdown
  trigger={<Button>Options</Button>}
  align="left" // left, right, center
>
  <DropdownItem onClick={handleEdit}>Edit</DropdownItem>
  <DropdownItem onClick={handleDuplicate}>Duplicate</DropdownItem>
  <DropdownDivider />
  <DropdownItem danger onClick={handleDelete}>
    Delete
  </DropdownItem>
</Dropdown>
```

### Theme Toggle
Components for switching between light and dark themes.

```jsx
import { ThemeToggle, ThemeSwitch } from '../components/ui';

// Icon toggle
<ThemeToggle showLabel />

// Switch toggle
<ThemeSwitch />
```

## Theme Context

The theme system is managed through a React Context:

```jsx
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';

// Wrap your app
<ThemeProvider>
  <App />
</ThemeProvider>

// Use in components
const { theme, toggleTheme } = useTheme();
```

## Responsive Design

All components are built with mobile-first responsive design:

- **Breakpoints**: `xs` (475px), `sm` (640px), `md` (768px), `lg` (1024px), `xl` (1280px), `2xl` (1536px)
- **Grid System**: Utilizes Tailwind's flexbox and grid utilities
- **Touch Optimized**: Larger touch targets on mobile devices
- **Adaptive Layouts**: Components adjust layout based on screen size

## Dark Mode

Dark mode is implemented using Tailwind's class strategy:

1. The `dark` class is added to the root HTML element
2. Components use `dark:` variants for dark mode styles
3. Theme is persisted in localStorage
4. Respects system preferences by default

## Customization

Components can be customized in several ways:

1. **Props**: Most components accept variant, size, and other configuration props
2. **className**: All components accept additional Tailwind classes
3. **Tailwind Config**: Modify `tailwind.config.js` for global changes
4. **CSS Variables**: Custom properties for dynamic theming

## Accessibility

All components follow accessibility best practices:

- Semantic HTML elements
- ARIA attributes where needed
- Keyboard navigation support
- Focus management
- Screen reader friendly

## Usage in Production

To use these components in your application:

1. Import the components you need
2. Wrap your app with `ThemeProvider`
3. Customize the Tailwind config as needed
4. Override styles with className prop when needed

## View Showcase

Visit `/ui-showcase` in development to see all components in action with live examples and interactions.
