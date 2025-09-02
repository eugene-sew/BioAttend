import { useQuery, useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { userApi, authApi } from '../../api/axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const ChangePasswordForm = () => {
  const [form, setForm] = useState({ old_password: '', new_password: '', confirm_password: '' });
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const mutation = useMutation({
    mutationFn: (payload) => authApi.changePassword(payload),
    onSuccess: () => {
      setError(null);
      setMessage('Password updated successfully.');
      setForm({ old_password: '', new_password: '', confirm_password: '' });
    },
    onError: (err) => {
      const msg = err?.response?.data?.error || err?.response?.data?.detail || 'Failed to change password.';
      setMessage(null);
      setError(msg);
    },
  });

  const onSubmit = (e) => {
    e.preventDefault();
    if (!form.old_password || !form.new_password || !form.confirm_password) {
      setError('Please fill in all fields.');
      setMessage(null);
      return;
    }
    if (form.new_password !== form.confirm_password) {
      setError('New password and confirmation do not match.');
      setMessage(null);
      return;
    }
    mutation.mutate(form);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Change Password</h3>
      {message && <div className="mb-4 text-green-700 bg-green-50 border border-green-200 rounded p-3">{message}</div>}
      {error && <div className="mb-4 text-red-700 bg-red-50 border border-red-200 rounded p-3">{error}</div>}
      <form onSubmit={onSubmit} className="space-y-4 max-w-md">
        <div>
          <label className="block text-sm font-medium text-gray-700">Current Password</label>
          <input
            type="password"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            value={form.old_password}
            onChange={(e) => setForm({ ...form, old_password: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">New Password</label>
          <input
            type="password"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            value={form.new_password}
            onChange={(e) => setForm({ ...form, new_password: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
          <input
            type="password"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            value={form.confirm_password}
            onChange={(e) => setForm({ ...form, confirm_password: e.target.value })}
            required
          />
        </div>
        <button
          type="submit"
          disabled={mutation.isLoading}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
        >
          {mutation.isLoading ? 'Updating...' : 'Update Password'}
        </button>
      </form>
    </div>
  );
};

const StudentProfilePage = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['me-profile'],
    queryFn: () => userApi.getProfile(),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded p-4 text-red-700">
        Failed to load profile.
      </div>
    );
  }

  const profile = data?.data;
  const student = profile?.student_profile;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">My Profile</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-2">Account</h4>
            <dl className="space-y-2">
              <div>
                <dt className="text-sm text-gray-500">Name</dt>
                <dd className="text-sm font-medium text-gray-900">{profile?.first_name} {profile?.last_name}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Email</dt>
                <dd className="text-sm font-medium text-gray-900">{profile?.email}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Role</dt>
                <dd className="text-sm font-medium text-gray-900">{profile?.role || profile?.user_type}</dd>
              </div>
            </dl>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-2">Student</h4>
            {student ? (
              <dl className="space-y-2">
                <div>
                  <dt className="text-sm text-gray-500">Student ID</dt>
                  <dd className="text-sm font-medium text-gray-900">{student.student_id}</dd>
                </div>
                {student.group && (
                  <div>
                    <dt className="text-sm text-gray-500">Group</dt>
                    <dd className="text-sm font-medium text-gray-900">{student.group.name} ({student.group.code})</dd>
                  </div>
                )}
                <div>
                  <dt className="text-sm text-gray-500">Status</dt>
                  <dd className={`text-sm font-medium ${student.status === 'ACTIVE' ? 'text-green-600' : 'text-red-600'}`}>{student.status}</dd>
                </div>
              </dl>
            ) : (
              <p className="text-sm text-gray-600">No student profile found.</p>
            )}
          </div>
        </div>
      </div>

      <ChangePasswordForm />
    </div>
  );
};

export default StudentProfilePage;
