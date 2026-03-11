# Schedule Management System - Component Documentation

## Overview

This directory contains a fully refactored schedule management system that was previously a single 2,110-line component. It has been broken down into **25+ modular, reusable components** organized by functionality.

### Refactoring Results
- **Before:** 2,110 lines in a single file
- **After:** 183 lines in main component + 25+ specialized components
- **Reduction:** ~91% reduction in main component size
- **Maintainability:** Significantly improved with clear separation of concerns

---

## 📁 Directory Structure

```
schedule/
├── README.md                          # This file
├── index.ts                           # Barrel export for easy imports
│
├── types/
│   └── scheduleTypes.ts               # TypeScript interfaces and types
│
├── utils/
│   ├── calendarUtils.ts               # Calendar utility functions
│   └── scheduleUtils.ts               # Schedule-specific utilities
│
├── hooks/
│   ├── useScheduleData.ts             # Data fetching and filtering hook
│   └── useCalendarNavigation.ts      # Calendar navigation hook
│
├── components/                        # Reusable UI components
│   ├── SearchSelect.tsx               # Searchable dropdown component
│   ├── EventCard.tsx                  # Event display card
│   ├── ScheduleHeader.tsx             # Page header with add button
│   ├── CalendarNavigation.tsx         # Calendar nav controls
│   ├── ViewModeSelector.tsx           # Week/Month/Doctors toggle
│   ├── ScheduleFilters.tsx            # Search and filter controls
│   ├── PatientInfoCard.tsx            # Patient information display
│   ├── DoctorInfoCard.tsx             # Doctor information display
│   ├── NurseInfoCard.tsx              # Nurse information display
│   ├── EventTypeSelector.tsx          # Consultation/Appointment toggle
│   ├── TimeSlotsSelector.tsx          # Time slot selection
│   ├── DoctorAvailabilityIndicator.tsx # Shows available doctors
│   ├── EventDetailCard.tsx            # Event detail display in drawer
│   └── DoctorScheduleCard.tsx         # Doctor card with schedule
│
├── views/                             # Calendar view components
│   ├── WeekView.tsx                   # 7-day week calendar view
│   ├── MonthView.tsx                  # Monthly calendar grid view
│   └── DoctorsScheduleContent.tsx     # Doctors' schedules view
│
└── modals/                            # Modal and drawer components
    ├── AddEventModal.tsx              # Add consultation/appointment modal
    ├── DateDetailsDrawer.tsx          # Slide-in drawer for date events
    └── AssignConsultationModal.tsx    # Quick patient assignment modal
```

---

## 🎯 Component Categories

### 1. **Types** (`types/`)

#### `scheduleTypes.ts`
Centralized TypeScript definitions for the entire schedule system.

**Exports:**
- `ScheduleEvent` - Main event interface
- `ViewMode` - Calendar view type ('week' | 'month' | 'doctors')
- `FilterType` - Event type filter
- `FilterStatus` - Event status filter
- `Patient`, `Doctor`, `Nurse` - Staff/patient interfaces
- `TimeSlot` - Available time slot interface

---

### 2. **Utilities** (`utils/`)

#### `calendarUtils.ts`
Date and calendar manipulation functions.

**Functions:**
- `getWeekStart(date)` - Get Monday of the week
- `getWeekDays(currentDate)` - Get array of 7 days for week view
- `toLocalDateStr(date)` - Format as YYYY-MM-DD
- `formatDate(date)` - Format as DD.MM.YYYY
- `getDayName(date)` - Get short day name (Mon, Tue)
- `getDayNameFull(date)` - Get full day name
- `getDateRangeString(currentDate, viewMode)` - Get display string for date range
- `isToday(date)` - Check if date is today
- `isSameDay(date1, date2)` - Compare two dates

#### `scheduleUtils.ts`
Schedule-specific utility functions.

**Functions:**
- `getStatusColor(status)` - Get color scheme for event status
- `getTypeColor(type)` - Get color scheme for event type

---

### 3. **Hooks** (`hooks/`)

#### `useScheduleData.ts`
Manages schedule data fetching and filtering.

**Exports:**
- `useScheduleData()` - Fetches and manages schedule events
  - Returns: `{ events, loading, error, fetchSchedule, setEvents }`
- `useFilteredEvents(events, searchQuery, filterType, filterStatus)` - Filters events
- `getEventsForDate(events, dateString)` - Get events for specific date

#### `useCalendarNavigation.ts`
Manages calendar navigation state.

**Exports:**
- `useCalendarNavigation()` - Calendar state and navigation
  - Returns: `{ currentDate, viewMode, setViewMode, navigateDate, goToToday }`

---

### 4. **Components** (`components/`)

#### Core UI Components

##### `SearchSelect.tsx`
Searchable dropdown with autocomplete functionality.

**Props:**
- `options` - Array of { id, label, subtitle? }
- `value` - Selected value
- `onChange` - Change handler
- `placeholder` - Placeholder text
- `required?` - Mark as required

**Features:**
- Real-time search filtering
- Keyboard navigation
- Click-outside to close
- Clear button

##### `EventCard.tsx`
Displays individual event in calendar views.

**Props:**
- `event` - ScheduleEvent object

**Features:**
- Color-coded by type (consultation/appointment)
- Status badge
- Hover actions (edit/delete)
- Responsive design

##### `ScheduleHeader.tsx`
Page header with title and add button.

**Props:**
- `onAddClick` - Callback for add button

##### `CalendarNavigation.tsx`
Calendar navigation controls.

**Props:**
- `dateRangeString` - Current date range text
- `onToday` - Go to today callback
- `onPrevious` - Previous period callback
- `onNext` - Next period callback

##### `ViewModeSelector.tsx`
Toggle between calendar views.

**Props:**
- `viewMode` - Current view mode
- `setViewMode` - Change view callback

##### `ScheduleFilters.tsx`
Search and filter controls.

**Props:**
- `searchQuery`, `setSearchQuery`
- `filterType`, `setFilterType`
- `filterStatus`, `setFilterStatus`

#### Info Card Components

##### `PatientInfoCard.tsx`
Displays patient information.

**Props:**
- `patient` - Patient object (name, email, phone, etc.)

##### `DoctorInfoCard.tsx`
Displays doctor information.

**Props:**
- `doctor` - Doctor object (name, specialization, etc.)

##### `NurseInfoCard.tsx`
Displays nurse information.

**Props:**
- `nurse` - Nurse object

#### Form Components

##### `EventTypeSelector.tsx`
Toggle between consultation and appointment.

**Props:**
- `eventType` - Current type
- `onChange` - Change handler

##### `TimeSlotsSelector.tsx`
Time slot selection with availability.

**Props:**
- `eventType` - Event type
- `formData` - Form data object
- `onChange` - Change handler
- `availableSlots` - Array of available slots
- `loadingSlots` - Loading state

##### `DoctorAvailabilityIndicator.tsx`
Shows number of available doctors.

**Props:**
- `availableDoctorIds` - Set of available doctor IDs
- `formData` - Form data with date/time
- `loadingAvailableDoctors` - Loading state

##### `EventDetailCard.tsx`
Event details in drawer.

**Props:**
- `event` - ScheduleEvent object

##### `DoctorScheduleCard.tsx`
Doctor card with schedule slots.

**Props:**
- `doctor` - Doctor object
- `slots` - Available slots
- `bookedSlots` - Booked events
- `loadingSlots` - Loading state
- `selectedDate` - Date string
- `onSlotClick` - Slot click handler

---

### 5. **Views** (`views/`)

#### `WeekView.tsx`
7-day week calendar view.

**Props:**
- `currentDate` - Date object
- `filteredEvents` - Event array
- `onDateClick` - Date click handler
- `onAddClick` - Add button handler

**Features:**
- Responsive grid layout
- Today highlighting
- Event cards per day
- Empty state messaging

#### `MonthView.tsx`
Monthly calendar grid view.

**Props:**
- `currentDate` - Date object
- `filteredEvents` - Event array
- `onDateClick` - Date click handler
- `onAddClick` - Add button handler
- `onShowDateDetails` - Show details handler

**Features:**
- 6-week grid (42 days)
- Previous/next month overflow days
- Event preview (2 events + counter)
- Click to see all events for date

#### `DoctorsScheduleContent.tsx`
Doctors' schedules overview.

**Props:**
- `selectedDate` - Date string
- `events` - Event array
- `fetchSchedule` - Refresh callback

**Features:**
- Grid of doctor cards
- Available slot indicators
- Search doctors by name/specialization
- Quick consultation assignment

---

### 6. **Modals** (`modals/`)

#### `AddEventModal.tsx`
Main modal for creating consultations/appointments.

**Props:**
- `show` - Visibility boolean
- `onClose` - Close handler
- `onEventAdded` - Success callback

**Features:**
- Toggle between consultation/appointment
- Patient/doctor/nurse selection with search
- Automatic doctor availability checking
- Time slot suggestions
- Form validation
- Info cards for selected entities

**API Calls:**
- Fetches patients, doctors, nurses
- Checks doctor availability
- Fetches available time slots
- Submits new events

#### `DateDetailsDrawer.tsx`
Slide-in drawer showing all events for a date.

**Props:**
- `isOpen` - Visibility boolean
- `onClose` - Close handler
- `selectedDate` - Date string
- `events` - Event array

**Features:**
- Animated slide-in from right
- Backdrop with blur
- Sorted event list
- Event detail cards

#### `AssignConsultationModal.tsx`
Quick modal for assigning patient to time slot.

**Props:**
- `show` - Visibility boolean
- `onClose` - Close handler
- `onAssigned` - Success callback
- `doctor` - Doctor object
- `slot` - Time slot object
- `selectedDate` - Date string

**Features:**
- Patient selection
- Pre-filled doctor and time
- Quick assignment workflow

---

## 🚀 Usage Examples

### Basic Import (Main Component)

```tsx
import ScheduleView from '@/components/services/admin/ScheduleView';

function AdminPage() {
  return <ScheduleView user={currentUser} />;
}
```

### Using Individual Components

```tsx
import {
  EventCard,
  SearchSelect,
  useScheduleData,
  getStatusColor
} from '@/components/services/admin/schedule';

function MyComponent() {
  const { events, loading } = useScheduleData();

  return (
    <div>
      {events.map(event => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
}
```

### Using Custom Hooks

```tsx
import { useScheduleData, useCalendarNavigation } from './schedule/hooks';

function Calendar() {
  const { events, loading, fetchSchedule } = useScheduleData();
  const { currentDate, navigateDate, goToToday } = useCalendarNavigation();

  return (
    <div>
      <button onClick={goToToday}>Today</button>
      <button onClick={() => navigateDate('prev')}>Previous</button>
      <button onClick={() => navigateDate('next')}>Next</button>
    </div>
  );
}
```

---

## 🔧 Customization

### Adding a New Event Type

1. Update `scheduleTypes.ts`:
```typescript
export type EventType = 'consultation' | 'appointment' | 'follow-up';
```

2. Update `scheduleUtils.ts`:
```typescript
case 'follow-up':
  return { bg: '#fff7ed', text: '#ea580c', label: 'Follow-up' };
```

3. Update `EventTypeSelector.tsx` to add new button

### Adding a New Filter

1. Add filter state in `ScheduleView.tsx`
2. Update `ScheduleFilters.tsx` component
3. Modify `useFilteredEvents` hook logic

---

## 🎨 Styling

All components use:
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **Lucide React** for icons
- Responsive design (mobile-first)
- Consistent color scheme

### Color Scheme

- **Blue (#3772ff)**: Primary actions, consultations
- **Purple (#8b5cf6)**: Appointments, secondary actions
- **Green (#10b981)**: Completed status, success
- **Amber (#f59e0b)**: In progress status
- **Red (#ef4444)**: Cancelled status, errors

---

## 📦 Dependencies

- `react` - Core React library
- `framer-motion` - Animations
- `lucide-react` - Icon library
- `react-toastify` - Toast notifications
- `@/utils/api` - API utility wrapper

---

## 🧪 Testing Recommendations

Each component can be tested independently:

1. **Unit Tests**: Test utility functions
2. **Component Tests**: Test individual components with props
3. **Integration Tests**: Test view components with mock data
4. **E2E Tests**: Test full user flows

---

## 📝 Notes

- All components are client-side ("use client")
- Components are fully typed with TypeScript
- Responsive design with mobile breakpoints
- Accessibility features included
- Russian language labels (can be internationalized)

---

## 🔄 Migration from Old Component

The refactoring maintains 100% feature parity with the original 2,110-line component:

✅ All three view modes (week, month, doctors)
✅ Event creation and management
✅ Filtering and search
✅ Date navigation
✅ Doctor availability checking
✅ Time slot management
✅ All API integrations
✅ All UI animations and interactions

---

## 👥 Contributing

When adding new features:

1. Follow the existing directory structure
2. Keep components focused and single-purpose
3. Use TypeScript for type safety
4. Add proper prop interfaces
5. Include JSDoc comments for complex functions
6. Maintain responsive design
7. Use existing utility functions when possible

---

## 📄 License

Part of the ZhanCare AI project.
