# Modern Data Table Component

A professional, feature-rich data table component built with React, TypeScript, and Tailwind CSS.

## Features

- ✅ **Full TypeScript Support** - Type-safe component with generic types
- ✅ **Advanced Search & Filtering** - Real-time search and multi-select filters
- ✅ **Modern Design** - Clean, professional styling with hover effects
- ✅ **Status Badges** - Color-coded badges with icons for status indicators
- ✅ **Loading States** - Built-in loading spinner and empty states
- ✅ **Responsive Design** - Mobile-friendly with horizontal scroll
- ✅ **Custom Renderers** - Flexible column rendering with custom components
- ✅ **Action Buttons** - Right-aligned action buttons for each row
- ✅ **Accessibility** - Keyboard navigation and ARIA support

## Components Included

1. **DataTable** - Main table component
2. **Badge** - Status badge component with variants
3. **ConfirmDialog** - Modal confirmation dialogs
4. **Toast** - Toast notification system
5. **ToastContainer & useToast** - Toast management hook

## Basic Usage

```typescript
import { DataTable, Column, Badge } from './components/DataTable'

interface User {
  id: string
  name: string
  email: string
  status: 'active' | 'inactive'
  role: string
}

const columns: Column<User>[] = [
  {
    key: 'name',
    label: 'Name',
    render: (value) => <span className="font-medium">{value}</span>
  },
  {
    key: 'email',
    label: 'Email'
  },
  {
    key: 'status',
    label: 'Status',
    render: (value) => (
      <Badge variant={value === 'active' ? 'success' : 'inactive'}>
        {value}
      </Badge>
    )
  }
]

const filters = [
  {
    key: 'status',
    label: 'Filter by Status',
    options: [
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' }
    ]
  }
]

function UserTable() {
  const [users, setUsers] = useState<User[]>([])
  
  return (
    <DataTable
      data={users}
      columns={columns}
      filters={filters}
      searchPlaceholder="Search users..."
      renderActions={(user) => (
        <button onClick={() => editUser(user.id)}>
          Edit
        </button>
      )}
    />
  )
}
```

## Column Configuration

```typescript
interface Column<T> {
  key: keyof T                                    // Data property key
  label: string                                   // Column header text
  sortable?: boolean                             // Enable sorting (future)
  filterable?: boolean                           // Enable filtering (future)
  render?: (value: any, item: T) => ReactNode   // Custom cell renderer
  className?: string                             // Additional CSS classes
}
```

## Badge Variants

The Badge component supports multiple variants:

```typescript
<Badge variant="active">Active</Badge>         // Green
<Badge variant="inactive">Inactive</Badge>     // Gray
<Badge variant="pending">Pending</Badge>       // Yellow
<Badge variant="expired">Expired</Badge>       // Red
<Badge variant="success">Success</Badge>       // Emerald
<Badge variant="warning">Warning</Badge>       // Orange
<Badge variant="danger">Danger</Badge>         // Red

// With icons
<Badge variant="active" icon={<CheckIcon />}>
  Active
</Badge>
```

## Filter Configuration

```typescript
interface Filter {
  key: string                                    // Property to filter by
  label: string                                  // Filter dropdown label
  options: { value: string; label: string }[]   // Available options
  multiple?: boolean                             // Allow multiple selection
}
```

## Toast Notifications

```typescript
import { useToast, ToastContainer } from './components/Toast'

function MyComponent() {
  const { toasts, addToast, removeToast } = useToast()
  
  const handleSuccess = () => {
    addToast('Operation completed successfully!', 'success')
  }
  
  return (
    <div>
      <button onClick={handleSuccess}>Success</button>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  )
}
```

## Confirm Dialog

```typescript
import { ConfirmDialog } from './components/ConfirmDialog'

function MyComponent() {
  const [showConfirm, setShowConfirm] = useState(false)
  
  return (
    <>
      <button onClick={() => setShowConfirm(true)}>
        Delete Item
      </button>
      
      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Item"
        message="Are you sure you want to delete this item? This action cannot be undone."
        variant="danger"
        confirmText="Delete"
      />
    </>
  )
}
```

## Advanced Example - Assessment Codes

See `src/app/admin/assessment-codes/modern-page.tsx` for a complete implementation showing:

- Custom column renderers with badges and icons
- Action buttons with status toggle and delete
- Multi-select filters for status and assessment type
- Copy-to-clipboard functionality
- Loading states and error handling
- Integration with existing API endpoints

## Styling Customization

The component uses Tailwind CSS classes. Key style points:

- **Header**: `bg-gray-50` with uppercase tracking
- **Rows**: White background with `hover:bg-gray-50`
- **Badges**: Rounded full with semantic colors
- **Buttons**: Ghost variants with hover states
- **Loading**: Centered spinner with message
- **Empty State**: Centered icon and message

## TypeScript Support

Full TypeScript support with:
- Generic data types for type safety
- Proper interface definitions
- Type inference for column keys
- Optional prop types

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile responsive design
- Touch-friendly interactions
- Keyboard navigation support