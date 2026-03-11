"use client";

import { useState } from "react";
import { motion } from "framer-motion";

// Hooks
import { useScheduleData, useFilteredEvents } from "./schedule/hooks/useScheduleData";
import { useCalendarNavigation } from "./schedule/hooks/useCalendarNavigation";

// Utils
import { getDateRangeString } from "./schedule/utils/calendarUtils";

// Types
import { FilterType, FilterStatus } from "./schedule/types/scheduleTypes";

// Components
import ScheduleHeader from "./schedule/components/ScheduleHeader";
import CalendarNavigation from "./schedule/components/CalendarNavigation";
import ViewModeSelector from "./schedule/components/ViewModeSelector";
import ScheduleFilters from "./schedule/components/ScheduleFilters";

// Views
import WeekView from "./schedule/views/WeekView";
import MonthView from "./schedule/views/MonthView";
import { DoctorsScheduleContent } from "./schedule/views/DoctorsScheduleContent";

// Modals
import AddEventModal from "./schedule/modals/AddEventModal";
import DateDetailsDrawer from "./schedule/modals/DateDetailsDrawer";

interface ScheduleViewProps {
  user: any;
}

export default function ScheduleView({ user }: ScheduleViewProps) {
  // Data hooks
  const { events, loading, error, fetchSchedule } = useScheduleData();
  const { currentDate, viewMode, setViewMode, navigateDate, goToToday } = useCalendarNavigation();

  // Modal and drawer state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDateDetailsDrawer, setShowDateDetailsDrawer] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');

  // Doctors view specific state - using current date from navigation
  const doctorsViewDate = (() => {
    const d = currentDate;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();

  // Get filtered events
  const filteredEvents = useFilteredEvents(events, searchQuery, filterType, filterStatus);

  // Get current date range string for display
  const dateRangeString = getDateRangeString(currentDate, viewMode);

  // Handle date click
  const handleDateClick = (date: string) => {
    setSelectedDate(date);
  };

  // Handle show date details
  const handleShowDateDetails = (date: string) => {
    setSelectedDate(date);
    setShowDateDetailsDrawer(true);
  };

  // Render current view
  const renderView = () => {
    switch (viewMode) {
      case 'week':
        return (
          <WeekView
            currentDate={currentDate}
            filteredEvents={filteredEvents}
            onDateClick={handleDateClick}
            onAddClick={() => setShowAddModal(true)}
          />
        );
      case 'month':
        return (
          <MonthView
            currentDate={currentDate}
            filteredEvents={filteredEvents}
            onDateClick={handleDateClick}
            onAddClick={() => setShowAddModal(true)}
            onShowDateDetails={handleShowDateDetails}
          />
        );
      case 'doctors':
        return (
          <DoctorsScheduleContent
            selectedDate={doctorsViewDate}
            events={events}
            fetchSchedule={fetchSchedule}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full">
      {/* Header */}
      <ScheduleHeader onAddClick={() => setShowAddModal(true)} />

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
          {/* Calendar Navigation */}
          <CalendarNavigation
            dateRangeString={dateRangeString}
            onToday={goToToday}
            onPrevious={() => navigateDate('prev')}
            onNext={() => navigateDate('next')}
          />

          {/* View Mode Selector */}
          <ViewModeSelector viewMode={viewMode} setViewMode={setViewMode} />

          {/* Filters */}
          {viewMode !== 'doctors' && (
            <ScheduleFilters
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              filterType={filterType}
              setFilterType={setFilterType}
              filterStatus={filterStatus}
              setFilterStatus={setFilterStatus}
            />
          )}

          {/* Loading and Error States */}
          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Загрузка расписания...</p>
            </div>
          )}

          {error && (
            <div className="text-center py-12">
              <p className="text-red-600">{error}</p>
              <button
                onClick={fetchSchedule}
                className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
              >
                Повторить попытку
              </button>
            </div>
          )}

        {/* Views */}
        {!loading && !error && renderView()}
      </motion.div>

      {/* Modals */}
      <AddEventModal
        show={showAddModal}
        onClose={() => setShowAddModal(false)}
        onEventAdded={fetchSchedule}
      />

      <DateDetailsDrawer
        isOpen={showDateDetailsDrawer}
        onClose={() => setShowDateDetailsDrawer(false)}
        selectedDate={selectedDate}
        events={events}
      />
    </div>
  );
}
