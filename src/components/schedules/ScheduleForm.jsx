import { useState, useEffect, useCallback } from 'react';
import { format, parseISO, parse, isValid } from 'date-fns';
import useScheduleApi from '../../hooks/useScheduleApi';

const ScheduleForm = ({ schedule, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    date: '',
    location: '',
    assigned_group: null,
    recurring: false,
    recurrence_pattern: 'weekly',
    recurrence_end_date: '',
    days_of_week: [],
    is_active: true
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [conflicts, setConflicts] = useState([]);
  
  const { createSchedule, updateSchedule, checkConflicts } = useScheduleApi();

  const daysOfWeek = [
    { value: 0, label: 'Sunday', short: 'Sun' },
    { value: 1, label: 'Monday', short: 'Mon' },
    { value: 2, label: 'Tuesday', short: 'Tue' },
    { value: 3, label: 'Wednesday', short: 'Wed' },
    { value: 4, label: 'Thursday', short: 'Thu' },
    { value: 5, label: 'Friday', short: 'Fri' },
    { value: 6, label: 'Saturday', short: 'Sat' }
  ];

  // Helpers to handle backend time-only strings and ISO datetimes
  const parseTimeString = useCallback((t) => {
    if (!t) return null;
    const d1 = parse(t, 'HH:mm:ss', new Date());
    if (isValid(d1)) return d1;
    const d2 = parse(t, 'HH:mm', new Date());
    if (isValid(d2)) return d2;
    const d3 = parseISO(t);
    if (isValid(d3)) return d3;
    return null;
  }, []);

  const toDateInput = (iso) => {
    if (!iso) return '';
    const d = parseISO(iso);
    return isValid(d) ? format(d, 'yyyy-MM-dd') : '';
  };

  const buildDateTimeLocal = useCallback((dateStr, timeStr) => {
    if (!dateStr || !timeStr) return '';
    // Expect timeStr like HH:mm[:ss]
    const t = parseTimeString(timeStr);
    if (!t) return '';
    const hh = String(t.getHours()).padStart(2, '0');
    const mm = String(t.getMinutes()).padStart(2, '0');
    return `${dateStr}T${hh}:${mm}`;
  }, [parseTimeString]);

  useEffect(() => {
    if (schedule) {
      const startDTL = schedule.start_time
        ? (schedule.start_time.includes('T')
            ? (() => {
                const d = parseISO(schedule.start_time);
                return isValid(d) ? format(d, "yyyy-MM-dd'T'HH:mm") : '';
              })()
            : buildDateTimeLocal(
                schedule.date || (schedule.start_time?.includes('T') ? (() => { const d = parseISO(schedule.start_time); return isValid(d) ? format(d, 'yyyy-MM-dd') : ''; })() : ''),
                schedule.start_time
              ))
        : '';

      const endDTL = schedule.end_time
        ? (schedule.end_time.includes('T')
            ? (() => {
                const d = parseISO(schedule.end_time);
                return isValid(d) ? format(d, "yyyy-MM-dd'T'HH:mm") : '';
              })()
            : buildDateTimeLocal(
                schedule.date || (schedule.end_time?.includes('T') ? (() => { const d = parseISO(schedule.end_time); return isValid(d) ? format(d, 'yyyy-MM-dd') : ''; })() : ''),
                schedule.end_time
              ))
        : '';

      setFormData({
        title: schedule.title || '',
        description: schedule.description || '',
        start_time: startDTL,
        end_time: endDTL,
        date: schedule.date || (schedule.start_time?.includes('T') ? (() => { const d = parseISO(schedule.start_time); return isValid(d) ? format(d, 'yyyy-MM-dd') : ''; })() : ''),
        location: schedule.location || '',
        assigned_group: schedule.assigned_group ?? schedule?.assigned_group_detail?.id ?? schedule?.groupId ?? null,
        recurring: !!schedule.recurring,
        recurrence_pattern: schedule.recurrence_pattern || 'weekly',
        recurrence_end_date: schedule.recurrence_end_date ? toDateInput(schedule.recurrence_end_date) : '',
        days_of_week: schedule.days_of_week || [],
        is_active: schedule.is_active !== undefined ? schedule.is_active : true
      });
    }
  }, [schedule, buildDateTimeLocal]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleDayToggle = (day) => {
    setFormData(prev => ({
      ...prev,
      days_of_week: prev.days_of_week.includes(day)
        ? prev.days_of_week.filter(d => d !== day)
        : [...prev.days_of_week, day].sort()
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.start_time) {
      newErrors.start_time = 'Start time is required';
    }

    if (!formData.end_time) {
      newErrors.end_time = 'End time is required';
    }

    if (formData.start_time && formData.end_time) {
      const start = new Date(formData.start_time);
      const end = new Date(formData.end_time);
      if (end <= start) {
        newErrors.end_time = 'End time must be after start time';
      }
    }

    if (formData.recurring) {
      if (formData.recurrence_pattern === 'weekly' && formData.days_of_week.length === 0) {
        newErrors.days_of_week = 'Please select at least one day of the week';
      }
      if (!formData.recurrence_end_date) {
        newErrors.recurrence_end_date = 'End date is required for recurring schedules';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const checkForConflicts = async () => {
    try {
      const conflictData = await checkConflicts({
        start_time: formData.start_time,
        end_time: formData.end_time,
        date: formData.date,
        location: formData.location,
        recurring: formData.recurring,
        days_of_week: formData.days_of_week,
        exclude_id: schedule?.id
      });
      
      if (conflictData && conflictData.length > 0) {
        setConflicts(conflictData);
        return true;
      }
      setConflicts([]);
      return false;
    } catch (error) {
      console.error('Error checking conflicts:', error);
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    // Check for conflicts
    const hasConflicts = await checkForConflicts();
    if (hasConflicts && !window.confirm('This schedule has conflicts with existing schedules. Do you want to continue?')) {
      setIsSubmitting(false);
      return;
    }

    try {
      const dataToSubmit = {
        ...formData,
        // Format dates for API
        start_time: new Date(formData.start_time).toISOString(),
        end_time: new Date(formData.end_time).toISOString(),
        recurrence_end_date: formData.recurrence_end_date ? 
          new Date(formData.recurrence_end_date).toISOString() : null
      };

      let result;
      if (schedule?.id) {
        result = await updateSchedule(schedule.id, dataToSubmit);
      } else {
        result = await createSchedule(dataToSubmit);
      }

      if (onSubmit) {
        onSubmit(result);
      }
    } catch (error) {
      console.error('Error submitting schedule:', error);
      setErrors({ submit: 'Failed to save schedule. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
          Title *
        </label>
        <input
          type="text"
          name="title"
          id="title"
          value={formData.title}
          onChange={handleChange}
          className={`mt-1 block w-full rounded-md shadow-sm ${
            errors.title ? 'border-red-300' : 'border-gray-300'
          } focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm`}
          placeholder="e.g., Computer Science 101"
        />
        {errors.title && (
          <p className="mt-1 text-sm text-red-600">{errors.title}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          name="description"
          id="description"
          rows={3}
          value={formData.description}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          placeholder="Optional description..."
        />
      </div>

      {/* Date and Time */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="start_time" className="block text-sm font-medium text-gray-700">
            Start Time *
          </label>
          <input
            type="datetime-local"
            name="start_time"
            id="start_time"
            value={formData.start_time}
            onChange={handleChange}
            className={`mt-1 block w-full rounded-md shadow-sm ${
              errors.start_time ? 'border-red-300' : 'border-gray-300'
            } focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm`}
          />
          {errors.start_time && (
            <p className="mt-1 text-sm text-red-600">{errors.start_time}</p>
          )}
        </div>

        <div>
          <label htmlFor="end_time" className="block text-sm font-medium text-gray-700">
            End Time *
          </label>
          <input
            type="datetime-local"
            name="end_time"
            id="end_time"
            value={formData.end_time}
            onChange={handleChange}
            className={`mt-1 block w-full rounded-md shadow-sm ${
              errors.end_time ? 'border-red-300' : 'border-gray-300'
            } focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm`}
          />
          {errors.end_time && (
            <p className="mt-1 text-sm text-red-600">{errors.end_time}</p>
          )}
        </div>
      </div>

      {/* Location */}
      <div>
        <label htmlFor="location" className="block text-sm font-medium text-gray-700">
          Location
        </label>
        <input
          type="text"
          name="location"
          id="location"
          value={formData.location}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          placeholder="e.g., Room 101, Building A"
        />
      </div>

      {/* Recurring Schedule */}
      <div className="space-y-4">
        <div className="flex items-center">
          <input
            type="checkbox"
            name="recurring"
            id="recurring"
            checked={formData.recurring}
            onChange={handleChange}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <label htmlFor="recurring" className="ml-2 block text-sm text-gray-900">
            Recurring Schedule
          </label>
        </div>

        {formData.recurring && (
          <div className="ml-6 space-y-4">
            {/* Recurrence Pattern */}
            <div>
              <label htmlFor="recurrence_pattern" className="block text-sm font-medium text-gray-700">
                Recurrence Pattern
              </label>
              <select
                name="recurrence_pattern"
                id="recurrence_pattern"
                value={formData.recurrence_pattern}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>

            {/* Days of Week (for weekly recurrence) */}
            {formData.recurrence_pattern === 'weekly' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Days of Week *
                </label>
                <div className="flex flex-wrap gap-2">
                  {daysOfWeek.map(day => (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => handleDayToggle(day.value)}
                      className={`px-3 py-1 rounded-md text-sm font-medium ${
                        formData.days_of_week.includes(day.value)
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {day.short}
                    </button>
                  ))}
                </div>
                {errors.days_of_week && (
                  <p className="mt-1 text-sm text-red-600">{errors.days_of_week}</p>
                )}
              </div>
            )}

            {/* Recurrence End Date */}
            <div>
              <label htmlFor="recurrence_end_date" className="block text-sm font-medium text-gray-700">
                End Date *
              </label>
              <input
                type="date"
                name="recurrence_end_date"
                id="recurrence_end_date"
                value={formData.recurrence_end_date}
                onChange={handleChange}
                className={`mt-1 block w-full rounded-md shadow-sm ${
                  errors.recurrence_end_date ? 'border-red-300' : 'border-gray-300'
                } focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm`}
              />
              {errors.recurrence_end_date && (
                <p className="mt-1 text-sm text-red-600">{errors.recurrence_end_date}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Active Status */}
      <div className="flex items-center">
        <input
          type="checkbox"
          name="is_active"
          id="is_active"
          checked={formData.is_active}
          onChange={handleChange}
          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
        />
        <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
          Active
        </label>
      </div>

      {/* Conflicts Warning */}
      {conflicts.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <h4 className="text-sm font-medium text-yellow-800 mb-2">Schedule Conflicts Detected:</h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            {conflicts.map((conflict, index) => (
              <li key={index}>• {conflict.message}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Error Message */}
      {errors.submit && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-600">{errors.submit}</p>
        </div>
      )}

      {/* Form Actions */}
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Saving...' : (schedule?.id ? 'Update' : 'Create')} Schedule
        </button>
      </div>
    </form>
  );
};

export default ScheduleForm;
