import { useState, useCallback } from 'react';
import { scheduleApi } from '../api';
import { toast } from 'react-hot-toast';

/**
 * Custom hook for schedule API operations
 */
const useScheduleApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Get all schedules with optional filters
   */
  const getSchedules = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await scheduleApi.getSchedules(params);
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch schedules';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get a single schedule by ID
   */
  const getSchedule = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const response = await scheduleApi.getSchedule(id);
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch schedule';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Create a new schedule
   */
  const createSchedule = useCallback(async (data) => {
    setLoading(true);
    setError(null);
    try {
      const response = await scheduleApi.createSchedule(data);
      toast.success('Schedule created successfully');
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.status === 403
        ? 'You are not authorized to create schedules.'
        : (err.response?.data?.message || 'Failed to create schedule');
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Update an existing schedule
   */
  const updateSchedule = useCallback(async (id, data) => {
    setLoading(true);
    setError(null);
    try {
      const response = await scheduleApi.updateSchedule(id, data);
      toast.success('Schedule updated successfully');
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.status === 403
        ? 'You are not authorized to update schedules.'
        : (err.response?.data?.message || 'Failed to update schedule');
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Delete a schedule
   */
  const deleteSchedule = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      await scheduleApi.deleteSchedule(id);
      toast.success('Schedule deleted successfully');
      return true;
    } catch (err) {
      const errorMessage = err.response?.status === 403
        ? 'You are not authorized to delete schedules.'
        : (err.response?.data?.message || 'Failed to delete schedule');
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get user's schedule
   */
  const getUserSchedule = useCallback(async (userId = null, params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await scheduleApi.getUserSchedule(userId, params);
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch user schedule';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Check for schedule conflicts
   */
  const checkConflicts = useCallback(async (data) => {
    setLoading(true);
    setError(null);
    try {
      const response = await scheduleApi.checkConflicts(data);
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to check conflicts';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get schedule templates
   */
  const getTemplates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await scheduleApi.getTemplates();
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch templates';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Create schedule from template
   */
  const createFromTemplate = useCallback(async (templateId, data) => {
    setLoading(true);
    setError(null);
    try {
      const response = await scheduleApi.createFromTemplate(templateId, data);
      toast.success('Schedule created from template successfully');
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to create schedule from template';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    getSchedules,
    getSchedule,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    getUserSchedule,
    checkConflicts,
    getTemplates,
    createFromTemplate
  };
};

export default useScheduleApi;
