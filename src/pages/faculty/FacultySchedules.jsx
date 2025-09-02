/* eslint-disable no-unused-vars */
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import ScheduleList from '../../components/schedules/ScheduleList';
import ScheduleForm from '../../components/schedules/ScheduleForm';

const FacultySchedules = () => {
  const [showForm, setShowForm] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [refreshList, setRefreshList] = useState(0);
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const role = user?.role;
  const canManage = role === 'ADMIN' || role === 'FACULTY';

  const handleCreateNew = () => {
    setSelectedSchedule(null);
    setShowForm(true);
  };

  const handleEdit = (schedule) => {
    setSelectedSchedule(schedule);
    setShowForm(true);
  };

  const handleFormSubmit = (schedule) => {
    setShowForm(false);
    setSelectedSchedule(null);
    setRefreshList((prev) => prev + 1); // Trigger list refresh
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setSelectedSchedule(null);
  };

  const handleDelete = () => {
    setRefreshList((prev) => prev + 1); // Trigger list refresh
  };

  // If navigated from Courses page with prefill data, open form automatically
  useEffect(() => {
    const state = location.state;
    if (state?.autoOpenForm) {
      const init = state?.initSchedule || null;
      setSelectedSchedule(init);
      setShowForm(true);
      // clear navigation state to avoid reopening on back/forward
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-lg bg-white p-6 shadow">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Schedule Management
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Create and manage class schedules
            </p>
          </div>
          {!showForm && canManage && (
            <button
              onClick={handleCreateNew}
              className="flex items-center space-x-2 rounded-md bg-indigo-600 px-4 py-2 text-white transition-colors hover:bg-indigo-700"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <span>New Schedule</span>
            </button>
          )}
        </div>
      </div>

      {/* Form or List */}
      {showForm && canManage ? (
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-medium text-gray-900">
            {selectedSchedule ? 'Edit Schedule' : 'Create New Schedule'}
          </h2>
          <ScheduleForm
            schedule={selectedSchedule}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
          />
        </div>
      ) : (
        <ScheduleList
          key={refreshList}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onSelect={(schedule) => console.log('Selected schedule:', schedule)}
        />
      )}
    </div>
  );
};

export default FacultySchedules;
