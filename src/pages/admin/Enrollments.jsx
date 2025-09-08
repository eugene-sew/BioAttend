import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { 
  MagnifyingGlassIcon, 
  UserPlusIcon, 
  EyeIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { facialApi, userApi } from '../../api/axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import BiometricEnrollmentModal from '../../components/attendance/BiometricEnrollmentModal';

const Enrollments = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const queryClient = useQueryClient();

  // Fetch all students using userApi
  const studentsQuery = useQuery({
    queryKey: ['students'],
    queryFn: async () => {
      try {
        const response = await userApi.getUsers();
        
        console.log('Full API response:', response);
        console.log('Response data keys:', Object.keys(response.data || {}));
        console.log('Response data:', response.data);
        
        // userApi.getUsers() returns the transformed data directly, not wrapped in .data
        const data = response.data || response;
        const students = data.results || data;
        
        console.log('Students array:', students);
        console.log('Students is array:', Array.isArray(students));
        
        if (!Array.isArray(students)) {
          throw new Error('Invalid data format received');
        }
        
        return students.filter(user => user.role === 'STUDENT');
      } catch (error) {
        console.error('Error fetching students:', error);
        throw error;
      }
    },
    enabled: true
  });

  // Fetch enrollment statistics
  const statsQuery = useQuery({
    queryKey: ['enrollment-stats'],
    queryFn: async () => {
      const { data } = await facialApi.getEnrollmentStats();
      return data;
    }
  });

  // Delete enrollment mutation
  const deleteEnrollmentMutation = useMutation({
    mutationFn: async (studentId) => {
      await facialApi.deleteEnrollment(studentId);
    },
    onSuccess: () => {
      toast.success('Enrollment deleted successfully');
      queryClient.invalidateQueries(['enrollment-stats']);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete enrollment');
    }
  });

  // Filter students based on search
  const filteredStudents = useMemo(() => {
    if (!studentsQuery.data) return [];
    
    return studentsQuery.data.filter(student => {
      const searchLower = searchTerm.toLowerCase();
      const fullName = `${student.first_name} ${student.last_name}`.toLowerCase();
      const email = student.email.toLowerCase();
      const studentId = student.student_profile?.student_id?.toLowerCase() || '';
      
      return fullName.includes(searchLower) || 
             email.includes(searchLower) || 
             studentId.includes(searchLower);
    });
  }, [studentsQuery.data, searchTerm]);

  const handleEnrollStudent = (student) => {
    setSelectedStudent(student);
    setShowEnrollModal(true);
  };

  const handleDeleteEnrollment = (studentId) => {
    if (window.confirm('Are you sure you want to delete this enrollment?')) {
      deleteEnrollmentMutation.mutate(studentId);
    }
  };

  const getEnrollmentStatus = (student) => {
    // Check if student is in recent enrollments from stats
    const recentEnrollments = statsQuery.data?.recent_enrollments || [];
    const isEnrolled = recentEnrollments.some(
      enrollment => enrollment.student_id === student.student_profile?.student_id
    );
    return isEnrolled ? 'enrolled' : 'not_enrolled';
  };

  const StatusBadge = ({ status }) => {
    const configs = {
      enrolled: {
        icon: CheckCircleIcon,
        text: 'Enrolled',
        className: 'bg-green-100 text-green-800'
      },
      not_enrolled: {
        icon: XCircleIcon,
        text: 'Not Enrolled',
        className: 'bg-red-100 text-red-800'
      },
      processing: {
        icon: ClockIcon,
        text: 'Processing',
        className: 'bg-yellow-100 text-yellow-800'
      }
    };

    const config = configs[status] || configs.not_enrolled;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.text}
      </span>
    );
  };

  if (studentsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (studentsQuery.error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600">Error loading students: {studentsQuery.error.message}</p>
          <button 
            onClick={() => studentsQuery.refetch()}
            className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  console.log('Filtered students:', filteredStudents); // Debug log

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Biometric Enrollments</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage student biometric enrollments for facial recognition attendance
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-3 md:p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserPlusIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Students
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {statsQuery.data?.total_students || filteredStudents.length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-3 md:p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Enrolled
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {statsQuery.data?.enrolled_students || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-3 md:p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-6 w-6 bg-blue-400 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-white">%</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Enrollment Rate
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {Math.round((statsQuery.data?.enrollment_rate || 0) * 100)}%
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-3 md:p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-6 w-6 bg-purple-400 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-white">Q</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Avg Quality
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {(statsQuery.data?.average_quality || 0).toFixed(2)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white shadow rounded-lg">
        <div className="p-3 md:p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Search students by name, email, or student ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Students</h3>
        </div>
        
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Group
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Enrollment Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStudents.map((student) => {
                const enrollmentStatus = getEnrollmentStatus(student);
                
                return (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-indigo-500 flex items-center justify-center">
                            <span className="text-sm font-medium text-white">
                              {student.first_name?.[0]}{student.last_name?.[0]}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {student.first_name} {student.last_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {student.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.student_profile?.student_id || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.student_profile?.group?.name || 'No Group'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        student.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {student.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={enrollmentStatus} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEnrollStudent(student)}
                          className="text-indigo-600 hover:text-indigo-900 p-1 rounded-full hover:bg-indigo-50"
                          title="Enroll Student"
                        >
                          <UserPlusIcon className="h-4 w-4" />
                        </button>
                        <button
                          className="text-gray-600 hover:text-gray-900 p-1 rounded-full hover:bg-gray-50"
                          title="View Details"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        {enrollmentStatus === 'enrolled' && (
                          <button
                            onClick={() => handleDeleteEnrollment(student.student_profile?.student_id)}
                            className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-50"
                            title="Delete Enrollment"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-3">
          {filteredStudents.map((student) => {
            const enrollmentStatus = getEnrollmentStatus(student);
            
            return (
              <div key={student.id} className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                <div className="flex items-start space-x-3">
                  <div className="h-12 w-12 flex-shrink-0">
                    <div className="h-12 w-12 rounded-full bg-indigo-500 flex items-center justify-center">
                      <span className="text-sm font-medium text-white">
                        {student.first_name?.[0]}{student.last_name?.[0]}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {student.first_name} {student.last_name}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {student.email}
                        </p>
                      </div>
                      <div className="flex flex-col items-end space-y-1">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          student.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {student.is_active ? 'Active' : 'Inactive'}
                        </span>
                        <StatusBadge status={enrollmentStatus} />
                      </div>
                    </div>
                    <div className="mt-2 space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Student ID:</span>
                        <span className="text-gray-900">{student.student_profile?.student_id || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Group:</span>
                        <span className="text-gray-900">{student.student_profile?.group?.name || 'No Group'}</span>
                      </div>
                    </div>
                    <div className="mt-3 flex space-x-2">
                      <button
                        onClick={() => handleEnrollStudent(student)}
                        className="flex-1 inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-100 px-3 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-200"
                        title="Enroll Student"
                      >
                        <UserPlusIcon className="h-4 w-4 mr-1" />
                        Enroll
                      </button>
                      <button
                        className="flex-1 inline-flex items-center justify-center rounded-md border border-transparent bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                        title="View Details"
                      >
                        <EyeIcon className="h-4 w-4 mr-1" />
                        View
                      </button>
                      {enrollmentStatus === 'enrolled' && (
                        <button
                          onClick={() => handleDeleteEnrollment(student.student_profile?.student_id)}
                          className="flex-1 inline-flex items-center justify-center rounded-md border border-transparent bg-red-100 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-200"
                          title="Delete Enrollment"
                        >
                          <TrashIcon className="h-4 w-4 mr-1" />
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {filteredStudents.length === 0 && (
          <div className="text-center py-12">
            <UserPlusIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No students found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'Try adjusting your search terms.' : 'No students available.'}
            </p>
          </div>
        )}
      </div>

      {/* Enrollment Modal */}
      {showEnrollModal && selectedStudent && (
        <BiometricEnrollmentModal
          isOpen={showEnrollModal}
          onClose={() => {
            setShowEnrollModal(false);
            setSelectedStudent(null);
          }}
          studentName={`${selectedStudent.first_name} ${selectedStudent.last_name}`}
          studentId={selectedStudent.student_profile?.student_id}
          onEnrolled={() => {
            setShowEnrollModal(false);
            setSelectedStudent(null);
            queryClient.invalidateQueries(['enrollment-stats']);
            toast.success('Student enrolled successfully');
          }}
        />
      )}
    </div>
  );
};

export default Enrollments;
