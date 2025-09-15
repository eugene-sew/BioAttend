import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  UserIcon,
  CalendarIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';
import { attendanceApi } from '../../api/axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import useAuthStore from '../../store/authStore';

const ManualRequests = () => {
  const { user } = useAuthStore();
  const [filter, setFilter] = useState('pending');
  const queryClient = useQueryClient();

  // Fetch manual attendance requests
  const { data: requestsData, isLoading, error } = useQuery({
    queryKey: ['manual-requests', filter],
    queryFn: async () => {
      const response = await attendanceApi.getManualRequests({ status: filter });
      return response.data;
    }
  });

  // Approve request mutation
  const approveMutation = useMutation({
    mutationFn: async ({ requestId, reason }) => {
      await attendanceApi.approveManualRequest(requestId, { reason });
    },
    onSuccess: () => {
      toast.success('Request approved successfully');
      queryClient.invalidateQueries(['manual-requests']);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to approve request');
    }
  });

  // Reject request mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ requestId, reason }) => {
      await attendanceApi.rejectManualRequest(requestId, { reason });
    },
    onSuccess: () => {
      toast.success('Request rejected');
      queryClient.invalidateQueries(['manual-requests']);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to reject request');
    }
  });

  const handleApprove = (request) => {
    const reason = prompt('Enter approval reason (optional):');
    if (reason !== null) {
      approveMutation.mutate({ requestId: request.id, reason });
    }
  };

  const handleReject = (request) => {
    const reason = prompt('Enter rejection reason:');
    if (reason) {
      rejectMutation.mutate({ requestId: request.id, reason });
    }
  };

  const getStatusBadge = (status) => {
    const configs = {
      pending: {
        icon: ClockIcon,
        text: 'Pending',
        className: 'bg-yellow-100 text-yellow-800'
      },
      approved: {
        icon: CheckCircleIcon,
        text: 'Approved',
        className: 'bg-green-100 text-green-800'
      },
      rejected: {
        icon: XCircleIcon,
        text: 'Rejected',
        className: 'bg-red-100 text-red-800'
      }
    };

    const config = configs[status] || configs.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.text}
      </span>
    );
  };

  const getPriorityBadge = (priority) => {
    const configs = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800'
    };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${configs[priority] || configs.medium}`}>
        {priority?.toUpperCase() || 'MEDIUM'}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Error loading requests</h3>
          <p className="mt-1 text-sm text-gray-500">{error.message}</p>
        </div>
      </div>
    );
  }

  const requests = requestsData?.requests || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manual Attendance Requests</h1>
          <p className="mt-2 text-sm text-gray-700">
            Review and manage manual attendance requests from students
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="h-8 w-8 text-yellow-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Pending Requests</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {requestsData?.stats?.pending || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-8 w-8 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Approved Today</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {requestsData?.stats?.approved_today || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <XCircleIcon className="h-8 w-8 text-red-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Rejected Today</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {requestsData?.stats?.rejected_today || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
            {[
              { key: 'pending', label: 'Pending', count: requestsData?.stats?.pending },
              { key: 'approved', label: 'Approved', count: requestsData?.stats?.approved_today },
              { key: 'rejected', label: 'Rejected', count: requestsData?.stats?.rejected_today },
              { key: 'all', label: 'All Requests', count: requestsData?.stats?.total }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`${
                  filter === tab.key
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className={`${
                    filter === tab.key ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-900'
                  } ml-2 py-0.5 px-2.5 rounded-full text-xs font-medium`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Requests List */}
        <div className="divide-y divide-gray-200">
          {requests.length === 0 ? (
            <div className="p-12 text-center">
              <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No requests found</h3>
              <p className="mt-1 text-sm text-gray-500">
                No {filter === 'all' ? '' : filter} requests at this time.
              </p>
            </div>
          ) : (
            requests.map((request) => (
              <div key={request.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <UserIcon className="h-6 w-6 text-gray-400" />
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">
                          {request.student_name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Student ID: {request.student_id}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <div className="flex items-center text-sm text-gray-500">
                        <CalendarIcon className="flex-shrink-0 mr-1.5 h-4 w-4" />
                        <span>Date: {request.attendance_date}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <AcademicCapIcon className="flex-shrink-0 mr-1.5 h-4 w-4" />
                        <span>Course: {request.course_name}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <ClockIcon className="flex-shrink-0 mr-1.5 h-4 w-4" />
                        <span>Requested: {new Date(request.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(request.status)}
                        {getPriorityBadge(request.priority)}
                      </div>
                    </div>

                    {request.reason && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-md">
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Reason:</span> {request.reason}
                        </p>
                      </div>
                    )}

                    {request.admin_response && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-md">
                        <p className="text-sm text-blue-700">
                          <span className="font-medium">Admin Response:</span> {request.admin_response}
                        </p>
                        <p className="text-xs text-blue-600 mt-1">
                          Reviewed by {request.reviewed_by} on {new Date(request.reviewed_at).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>

                  {request.status === 'pending' && (
                    <div className="flex-shrink-0 ml-4 flex space-x-2">
                      <button
                        onClick={() => handleApprove(request)}
                        disabled={approveMutation.isLoading}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                      >
                        <CheckCircleIcon className="h-4 w-4 mr-1" />
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(request)}
                        disabled={rejectMutation.isLoading}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                      >
                        <XCircleIcon className="h-4 w-4 mr-1" />
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ManualRequests;
