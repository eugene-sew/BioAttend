import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi, facultyApi, studentApi } from '../../api/axios';
import axiosInstance from '../../api/axios';
import toast from 'react-hot-toast';

const UserManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    role: 'STUDENT',
    department: '',
    student_id: '',
    faculty_id: '',
    is_active: true,
    group: '',
    groups: [],
  });
  const [groups, setGroups] = useState([]);

  const queryClient = useQueryClient();
  const itemsPerPage = 10;

  // Load student groups (admin only)
  useEffect(() => {
    const loadGroups = async () => {
      try {
        const res = await axiosInstance.get('/api/students/groups/');
        const data = res.data;
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.results)
            ? data.results
            : [];
        setGroups(list);
      } catch (e) {
        // non-fatal
        console.error('Failed to load groups', e);
      }
    };
    loadGroups();
  }, []);

  // Fetch users with filters
  const {
    data: usersData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['users', currentPage, searchTerm, selectedRole],
    queryFn: () =>
      userApi.getUsers({
        page: currentPage,
        page_size: itemsPerPage,
        search: searchTerm,
        role: selectedRole === 'all' ? undefined : selectedRole,
      }),
    keepPreviousData: true,
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: userApi.createUser,
    onSuccess: async (createdUser) => {
      try {
        // If creating a faculty, sync selected groups onto the faculty profile
        if (formData.role === 'FACULTY') {
          const selectedGroupIds = Array.isArray(formData.groups)
            ? formData.groups.map((g) => Number(g))
            : [];
          // Resolve faculty id from response if available, otherwise query by user id
          let facultyId = createdUser?.faculty_profile?.id;
          if (!facultyId && createdUser?.id) {
            const list = await facultyApi.list({ user: createdUser.id });
            const results = Array.isArray(list?.results) ? list.results : Array.isArray(list) ? list : [];
            facultyId = results[0]?.id;
          }
          if (facultyId !== undefined && facultyId !== null) {
            await facultyApi.update(facultyId, { groups: selectedGroupIds });
          }
        }
        toast.success('User created successfully');
      } catch (err) {
        console.error('Failed to sync faculty groups', err);
        toast.error('User created, but failed to assign courses');
      } finally {
        queryClient.invalidateQueries(['users']);
        closeModal();
      }
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create user');
    },
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }) => userApi.updateUser(id, data),
    onSuccess: async (updatedUser) => {
      try {
        // Handle faculty group assignments
        if ((editingUser?.role || formData.role) === 'FACULTY') {
          const selectedGroupIds = Array.isArray(formData.groups)
            ? formData.groups.map((g) => Number(g))
            : [];
          let facultyId = updatedUser?.faculty_profile?.id ?? editingUser?.faculty_profile?.id;
          if (!facultyId && (updatedUser?.id || editingUser?.id)) {
            const list = await facultyApi.list({ user: updatedUser?.id || editingUser?.id });
            const results = Array.isArray(list?.results) ? list.results : Array.isArray(list) ? list : [];
            facultyId = results[0]?.id;
          }
          if (facultyId !== undefined && facultyId !== null) {
            await facultyApi.update(facultyId, { groups: selectedGroupIds });
          }
        }
        
        // Handle student course assignment
        if ((editingUser?.role || formData.role) === 'STUDENT' && formData.group) {
          try {
            // Update student profile with new group
            const studentId = editingUser?.student_profile?.student_id;
            if (studentId) {
              await studentApi.updateProfile(studentId, {
                group: formData.group
              });
            }
          } catch (studentError) {
            console.error('Failed to update student course:', studentError);
            toast.error('User updated, but failed to assign course');
          }
        }
        
        toast.success('User updated successfully');
      } catch (err) {
        console.error('Failed to sync user assignments', err);
        toast.error('User updated, but failed to assign courses');
      } finally {
        queryClient.invalidateQueries(['users']);
        closeModal();
      }
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update user');
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: userApi.deleteUser,
    onSuccess: () => {
      toast.success('User deleted successfully');
      queryClient.invalidateQueries(['users']);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete user');
    },
  });

  const handleSearch = useCallback((e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  }, []);

  const handleRoleFilter = useCallback((e) => {
    setSelectedRole(e.target.value);
    setCurrentPage(1);
  }, []);

  const openModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        role: user.role || 'STUDENT',
        department: user.faculty_profile?.department || '',
        student_id: user.student_profile?.student_id || '',
        faculty_id: user.faculty_profile?.faculty_id || '',
        is_active: user.is_active !== undefined ? user.is_active : true,
        group: user.student_profile?.group?.id || '',
        groups: user.faculty_profile?.groups ? 
          user.faculty_profile.groups.map(g => g.id) : [],
      });
    } else {
      setEditingUser(null);
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        role: 'STUDENT',
        department: '',
        student_id: '',
        faculty_id: '',
        is_active: true,
        group: '',
        groups: [],
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      role: 'STUDENT',
      department: '',
      student_id: '',
      faculty_id: '',
      is_active: true,
      group: '',
      groups: [],
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const submitData = { ...formData };

    // Remove role-specific fields if not applicable
    if (formData.role !== 'STUDENT') {
      delete submitData.student_id;
      delete submitData.group;
    }
    if (formData.role !== 'FACULTY') {
      delete submitData.faculty_id;
      delete submitData.department;
    } else {
      // Ensure department is non-empty to satisfy backend NOT NULL
      if (
        !submitData.department ||
        String(submitData.department).trim() === ''
      ) {
        submitData.department = 'General';
      }
    }
    // Backend does not accept `groups` on user create/update; linkage is via schedules.
    // Keep UI for selection reference but do not send to backend.
    delete submitData.groups;

    if (editingUser) {
      // Validation for editing users
      if (formData.role === 'STUDENT' && !formData.group) {
        toast.error('Please select a Course for the student');
        return;
      }
      updateUserMutation.mutate({ id: editingUser.id, data: submitData });
    } else {
      // Validation for creating users
      if (formData.role === 'STUDENT' && !formData.group) {
        toast.error('Please select a Course for the student');
        return;
      }
      submitData.password = 'TempPassword123!';
      createUserMutation.mutate(submitData);
    }
  };

  const handleDelete = (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      deleteUserMutation.mutate(userId);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked, multiple, options } = e.target;
    let newValue = value;
    if (name === 'groups' && multiple) {
      newValue = Array.from(options)
        .filter((opt) => opt.selected)
        .map((opt) => opt.value);
    }
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : newValue,
    }));
  };

  const users = usersData?.results || [];
  const totalPages = Math.ceil((usersData?.count || 0) / itemsPerPage);

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="rounded-lg bg-white p-3 md:p-6 shadow">
        <div className="mb-4 md:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">User Management</h2>
          <button
            onClick={() => openModal()}
            className="rounded-md bg-indigo-600 px-4 py-2 text-white transition-colors hover:bg-indigo-700 w-full sm:w-auto"
          >
            <span className="flex items-center justify-center">
              <svg
                className="mr-2 h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Add User
            </span>
          </button>
        </div>

        {/* Search and Filter */}
        <div className="mb-4 md:mb-6 flex flex-col gap-4 sm:flex-row">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
          <div className="sm:w-48">
            <select
              value={selectedRole}
              onChange={handleRoleFilter}
              className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="all">All Roles</option>
              <option value="ADMIN">Admin</option>
              <option value="FACULTY">Faculty</option>
              <option value="STUDENT">Student</option>
            </select>
          </div>
        </div>

        {/* Users Table/Cards */}
        {isLoading ? (
          <div className="py-12 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-indigo-600"></div>
          </div>
        ) : error ? (
          <div className="py-12 text-center text-red-600">
            Error loading users: {error.message}
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Course/Courses
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500">
                              <span className="font-medium text-white">
                                {user.first_name?.[0]}
                                {user.last_name?.[0]}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.first_name} {user.last_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {user.student_id || user.faculty_id || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                        {user.email}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                            user.role === 'ADMIN'
                              ? 'bg-purple-100 text-purple-800'
                              : user.role === 'FACULTY'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="flex flex-wrap gap-1">
                          {(() => {
                            // For students, show their single group/course
                            if (user.role === 'STUDENT' && user.student_profile?.group) {
                              const group = user.student_profile.group;
                              return (
                                <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                                  {group.name || group.code}
                                </span>
                              );
                            }
                            // For faculty, show their multiple groups/courses
                            if (user.role === 'FACULTY' && user.faculty_profile?.groups?.length > 0) {
                              return user.faculty_profile.groups.map((group, index) => (
                                <span
                                  key={group.id || index}
                                  className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800"
                                >
                                  {group.name || group.code}
                                </span>
                              ));
                            }
                            // For admin or users without courses
                            return (
                              <span className="text-gray-500 text-xs">No courses assigned</span>
                            );
                          })()}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                        >
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                        <button
                          onClick={() => openModal(user)}
                          className="mr-3 text-indigo-600 hover:text-indigo-900"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {users.map((user) => (
                <div key={user.id} className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                  <div className="flex items-start space-x-3">
                    <div className="h-12 w-12 flex-shrink-0">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500">
                        <span className="font-medium text-white">
                          {user.first_name?.[0]}
                          {user.last_name?.[0]}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {user.first_name} {user.last_name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {user.student_id || user.faculty_id || 'N/A'}
                          </p>
                        </div>
                        <div className="flex flex-col items-end space-y-1">
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                              user.role === 'ADMIN'
                                ? 'bg-purple-100 text-purple-800'
                                : user.role === 'FACULTY'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-green-100 text-green-800'
                            }`}
                          >
                            {user.role}
                          </span>
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                          >
                            {user.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                      <div className="mt-2 space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Email:</span>
                          <span className="text-gray-900 truncate ml-2">{user.email}</span>
                        </div>
                        <div className="flex justify-between text-sm items-start">
                          <span className="text-gray-500 flex-shrink-0">Courses:</span>
                          <div className="flex flex-wrap gap-1 ml-2 justify-end">
                            {(() => {
                              // For students, show their single group/course
                              if (user.role === 'STUDENT' && user.student_profile?.group) {
                                const group = user.student_profile.group;
                                return (
                                  <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                                    {group.name || group.code}
                                  </span>
                                );
                              }
                              // For faculty, show their multiple groups/courses
                              if (user.role === 'FACULTY' && user.faculty_profile?.groups?.length > 0) {
                                return user.faculty_profile.groups.map((group, index) => (
                                  <span
                                    key={group.id || index}
                                    className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800"
                                  >
                                    {group.name || group.code}
                                  </span>
                                ));
                              }
                              // For admin or users without courses
                              return (
                                <span className="text-gray-500 text-xs">None</span>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 flex space-x-2">
                        <button
                          onClick={() => openModal(user)}
                          className="flex-1 inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-100 px-3 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-200"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="flex-1 inline-flex items-center justify-center rounded-md border border-transparent bg-red-100 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-200"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-4 md:mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                <div className="text-sm text-gray-700 text-center sm:text-left">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                  {Math.min(currentPage * itemsPerPage, usersData?.count || 0)}{' '}
                  of {usersData?.count || 0} users
                </div>
                <div className="flex gap-2 justify-center sm:justify-end">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="rounded-md border border-gray-300 bg-white px-3 md:px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(
                      (page) =>
                        page === 1 ||
                        page === totalPages ||
                        Math.abs(page - currentPage) <= 1,
                    )
                    .map((page, index, array) => (
                      <React.Fragment key={page}>
                        {index > 0 && array[index - 1] !== page - 1 && (
                          <span className="px-2 py-2 text-sm text-gray-500 hidden sm:inline">
                            ...
                          </span>
                        )}
                        <button
                          onClick={() => setCurrentPage(page)}
                          className={`rounded-md px-3 md:px-4 py-2 text-sm font-medium ${
                            currentPage === page
                              ? 'bg-indigo-600 text-white'
                              : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      </React.Fragment>
                    ))}
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                    className="rounded-md border border-gray-300 bg-white px-3 md:px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
            <span className="hidden sm:inline-block sm:h-screen sm:align-middle">
              &#8203;
            </span>
            <div className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 w-full max-w-lg sm:align-middle">
              <form onSubmit={handleSubmit}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-medium leading-6 text-gray-900">
                      {editingUser ? 'Edit User' : 'Add New User'}
                    </h3>
                    <button
                      type="button"
                      onClick={closeModal}
                      className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <svg
                        className="h-6 w-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      First Name
                    </label>
                    <input
                      type="text"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      required
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Last Name
                    </label>
                    <input
                      type="text"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      required
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Role
                    </label>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500"
                    >
                      <option value="STUDENT">Student</option>
                      <option value="FACULTY">Faculty</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>

                  {formData.role === 'STUDENT' && (
                    <>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                          Student ID
                        </label>
                        <input
                          type="text"
                          name="student_id"
                          value={formData.student_id}
                          onChange={handleInputChange}
                          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                          Course
                        </label>
                        <select
                          name="group"
                          value={formData.group}
                          onChange={handleInputChange}
                          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500"
                        >
                          <option value="">Select course...</option>
                          {groups.map((g) => (
                            <option key={g.id} value={g.id}>
                              {g.name} ({g.code})
                            </option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}

                  {formData.role === 'FACULTY' && (
                    <>
                      {editingUser && (
                        <div>
                          <label className="mb-1 block text-sm font-medium text-gray-700">
                            Faculty ID
                          </label>
                          <input
                            type="text"
                            name="faculty_id"
                            value={formData.faculty_id}
                            readOnly
                            className="w-full cursor-not-allowed rounded-md border border-gray-300 bg-gray-100 px-3 py-2"
                          />
                        </div>
                      )}
                      <div className="md:col-span-2">
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                          Courses (assign one or more)
                        </label>
                        <select
                          multiple
                          name="groups"
                          value={formData.groups}
                          onChange={handleInputChange}
                          className="min-h-[120px] w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500"
                        >
                          {groups.map((g) => (
                            <option key={g.id} value={g.id}>
                              {g.name} ({g.code})
                            </option>
                          ))}
                        </select>
                        <p className="mt-1 text-xs text-gray-500">
                          Hold Ctrl/Cmd to select multiple.
                        </p>
                      </div>
                    </>
                  )}

                    <div className="sm:col-span-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          name="is_active"
                          checked={formData.is_active}
                          onChange={handleInputChange}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          Active User
                        </span>
                      </label>
                    </div>
                  </div>

                  {!editingUser && (
                    <div className="mt-4 rounded-md bg-yellow-50 p-3">
                      <p className="text-sm text-yellow-800">
                        A temporary password will be set for the new user. They
                        will be required to change it on first login.
                      </p>
                    </div>
                  )}
                </div>

                <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                  <button
                    type="submit"
                    disabled={
                      createUserMutation.isLoading ||
                      updateUserMutation.isLoading
                    }
                    className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 sm:ml-3 sm:w-auto"
                  >
                    {createUserMutation.isLoading ||
                    updateUserMutation.isLoading
                      ? 'Saving...'
                      : editingUser
                        ? 'Update User'
                        : 'Create User'}
                  </button>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 sm:mt-0 sm:w-auto"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
