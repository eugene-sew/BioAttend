import { useState } from 'react';
import {
  Button,
  Input,
  Textarea,
  Select,
  Modal,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TablePagination,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  StatsCard,
  Avatar,
  AvatarGroup,
  ThemeToggle,
  ThemeSwitch,
} from '../components/ui';

const UIShowcase = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
    country: '',
  });

  // Sample data for table
  const tableData = [
    { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin', status: 'Active' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User', status: 'Active' },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'User', status: 'Inactive' },
    { id: 4, name: 'Alice Brown', email: 'alice@example.com', role: 'Moderator', status: 'Active' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
      {/* Header with Theme Toggle */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            UI Components Showcase
          </h1>
          <div className="flex items-center gap-4">
            <ThemeToggle showLabel />
            <ThemeSwitch />
          </div>
        </div>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Responsive and accessible UI components with Tailwind CSS
        </p>
      </div>

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Buttons Section */}
        <Card>
          <CardHeader>
            <CardTitle>Buttons</CardTitle>
            <CardDescription>Various button styles and sizes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Button Variants */}
              <div className="flex flex-wrap gap-2">
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="success">Success</Button>
                <Button variant="danger">Danger</Button>
                <Button variant="warning">Warning</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="outline">Outline</Button>
              </div>

              {/* Button Sizes */}
              <div className="flex flex-wrap items-center gap-2">
                <Button size="xs">Extra Small</Button>
                <Button size="sm">Small</Button>
                <Button size="md">Medium</Button>
                <Button size="lg">Large</Button>
                <Button size="xl">Extra Large</Button>
              </div>

              {/* Button States */}
              <div className="flex flex-wrap gap-2">
                <Button disabled>Disabled</Button>
                <Button loading>Loading</Button>
                <Button fullWidth>Full Width</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Input Fields Section */}
        <Card>
          <CardHeader>
            <CardTitle>Form Inputs</CardTitle>
            <CardDescription>Text inputs, textareas, and select fields</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Name"
                placeholder="Enter your name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              <Input
                label="Email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                error={formData.email && !formData.email.includes('@') ? 'Invalid email' : ''}
              />
              <Select
                label="Country"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              >
                <option value="">Select a country</option>
                <option value="us">United States</option>
                <option value="uk">United Kingdom</option>
                <option value="ca">Canada</option>
              </Select>
              <Textarea
                label="Message"
                placeholder="Enter your message"
                rows={3}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                helperText="Maximum 500 characters"
              />
            </div>
          </CardContent>
        </Card>

        {/* Avatars Section */}
        <Card>
          <CardHeader>
            <CardTitle>Avatars</CardTitle>
            <CardDescription>User avatars with different sizes and states</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Avatar Sizes */}
              <div className="flex flex-wrap items-center gap-4">
                <Avatar name="John Doe" size="xs" />
                <Avatar name="Jane Smith" size="sm" />
                <Avatar name="Bob Johnson" size="md" />
                <Avatar name="Alice Brown" size="lg" />
                <Avatar name="Charlie Wilson" size="xl" />
                <Avatar name="Diana Prince" size="2xl" />
              </div>

              {/* Avatar with Status */}
              <div className="flex flex-wrap items-center gap-4">
                <Avatar name="Online User" status="online" />
                <Avatar name="Offline User" status="offline" />
                <Avatar name="Busy User" status="busy" />
                <Avatar name="Away User" status="away" />
              </div>

              {/* Avatar Group */}
              <div>
                <AvatarGroup max={4}>
                  <Avatar name="User 1" />
                  <Avatar name="User 2" />
                  <Avatar name="User 3" />
                  <Avatar name="User 4" />
                  <Avatar name="User 5" />
                  <Avatar name="User 6" />
                </AvatarGroup>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total Users"
            value="1,234"
            description="All registered users"
            trend="up"
            trendValue="+12.5%"
            icon={
              <svg className="w-6 h-6 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
              </svg>
            }
          />
          <StatsCard
            title="Revenue"
            value="$45,678"
            description="Total revenue this month"
            trend="up"
            trendValue="+8.2%"
          />
          <StatsCard
            title="Active Sessions"
            value="892"
            description="Current active users"
            trend="down"
            trendValue="-3.1%"
          />
          <StatsCard
            title="Conversion Rate"
            value="3.24%"
            description="Average conversion"
            trend="up"
            trendValue="+0.5%"
          />
        </div>

        {/* Table Section */}
        <Card padding="none">
          <div className="p-4 sm:p-6">
            <CardTitle>Data Table</CardTitle>
            <CardDescription>Responsive table with sorting and pagination</CardDescription>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tableData.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.name}</TableCell>
                  <TableCell>{row.email}</TableCell>
                  <TableCell>{row.role}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        row.status === 'Active'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {row.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            currentPage={currentPage}
            totalPages={3}
            onPageChange={setCurrentPage}
            itemsPerPage={10}
            totalItems={24}
          />
        </Card>

        {/* Modal Section */}
        <Card>
          <CardHeader>
            <CardTitle>Modal Dialog</CardTitle>
            <CardDescription>Click the button to open a modal</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setModalOpen(true)}>Open Modal</Button>
          </CardContent>
        </Card>

        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Example Modal"
          size="md"
          footer={
            <>
              <Button variant="ghost" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setModalOpen(false)}>Save Changes</Button>
            </>
          }
        >
          <p className="text-gray-700 dark:text-gray-300">
            This is a modal dialog with a title, content area, and footer buttons. It supports
            different sizes and can be closed by clicking outside or pressing ESC.
          </p>
          <div className="mt-4">
            <Input
              label="Modal Input"
              placeholder="Type something..."
              fullWidth
            />
          </div>
        </Modal>

        {/* Mobile Responsiveness Demo */}
        <Card>
          <CardHeader>
            <CardTitle>Mobile Responsiveness</CardTitle>
            <CardDescription>
              Resize your browser to see responsive behavior
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 bg-primary-100 dark:bg-primary-900 rounded-lg">
                <p className="text-sm font-medium text-primary-900 dark:text-primary-100">
                  Mobile First
                </p>
                <p className="text-xs text-primary-700 dark:text-primary-300 mt-1">
                  Components adapt to screen size
                </p>
              </div>
              <div className="p-4 bg-secondary-100 dark:bg-secondary-900 rounded-lg">
                <p className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                  Touch Friendly
                </p>
                <p className="text-xs text-secondary-700 dark:text-secondary-300 mt-1">
                  Optimized for touch interactions
                </p>
              </div>
              <div className="p-4 bg-green-100 dark:bg-green-900 rounded-lg">
                <p className="text-sm font-medium text-green-900 dark:text-green-100">
                  Flexible Grid
                </p>
                <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                  Responsive grid layouts
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UIShowcase;
