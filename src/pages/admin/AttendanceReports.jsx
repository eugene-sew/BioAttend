/* eslint-disable no-unused-vars */
import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { attendanceApi, groupsApi, facultyApi } from '../../api/axios';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import {
  ChartBarIcon,
  DocumentArrowDownIcon,
  CalendarIcon,
  UserGroupIcon,
  AcademicCapIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const AttendanceReports = () => {
  const { user } = useAuthStore();
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30))
      .toISOString()
      .split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  const [selectedGroup, setSelectedGroup] = useState('');
  const [reportType, setReportType] = useState('summary');

  // Fetch groups based on user role
  const { data: groupsData } = useQuery({
    queryKey: ['groups', user?.role],
    queryFn: async () => {
      if (user?.role === 'ADMIN') {
        // Admin can see all groups
        const groups = await groupsApi.list();
        return groups;
      } else if (user?.role === 'FACULTY') {
        // Faculty can see only their assigned groups
        const groups = await facultyApi.getMyGroups();
        return groups;
      }
      return [];
    },
    enabled: !!user && user.role !== 'STUDENT',
  });

  // Set default group for faculty users
  useEffect(() => {
    if (user?.role === 'FACULTY' && groupsData?.length > 0 && !selectedGroup) {
      setSelectedGroup(groupsData[0].id.toString());
    } else if (
      user?.role === 'ADMIN' &&
      groupsData?.length > 0 &&
      !selectedGroup
    ) {
      setSelectedGroup(groupsData[0].id.toString());
    }
  }, [groupsData, user?.role, selectedGroup]);

  // Fetch attendance report (admin/faculty) or student summary (student)
  const {
    data: statsData,
    isLoading: statsLoading,
    error: statsError,
  } = useQuery({
    queryKey: ['attendance-report', dateRange, selectedGroup, user?.role],
    queryFn: async () => {
      const params = {
        from: dateRange.startDate,
        to: dateRange.endDate,
      };

      if (user?.role === 'STUDENT') {
        // Students get their own compact statistics
        return await attendanceApi.getStudentAttendance(params);
      } else {
        // Admin and Faculty need group parameter (by group CODE)
        if (!selectedGroup) {
          throw new Error('Please select a group');
        }
        const code = groupsData?.find(
          (g) => g.id.toString() === selectedGroup
        )?.code;
        if (!code) {
          throw new Error('Selected group code not found');
        }
        params.group = code;
        // Use rich report endpoint with overall stats + daily + absentees + punctuality
        return await attendanceApi.getReport(params);
      }
    },
    enabled: !!user && (user.role === 'STUDENT' || !!selectedGroup),
  });

  // Fetch detailed records for admin/faculty or student records for students
  const { data: recordsData, isLoading: recordsLoading } = useQuery({
    queryKey: ['attendance-records', dateRange, selectedGroup, user?.role],
    queryFn: async () => {
      const params = {
        from: dateRange.startDate,
        to: dateRange.endDate,
      };

      if (user?.role === 'STUDENT') {
        return await attendanceApi.getStudentRecords(params);
      } else if (user?.role === 'ADMIN' || user?.role === 'FACULTY') {
        // Get detailed records with student names for reports
        if (!selectedGroup) return null;
        const code = groupsData?.find(
          (g) => g.id.toString() === selectedGroup
        )?.code;
        if (!code) return null;
        params.group = code;
        return await attendanceApi.getDetailedRecords(params);
      }
      return null;
    },
    enabled: !!user && (user.role === 'STUDENT' || (!!selectedGroup && !!groupsData)),
  });

  const handleDateChange = (field, value) => {
    setDateRange((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Derive student counts once from either stats (preferred) or records fallback
  const studentDerived = useMemo(() => {
    if (user?.role !== 'STUDENT') return null;
    const s = statsData?.data || {};
    // Handle both direct stats object and nested statistics
    const stats = s.statistics || s;
    const present = (stats.total_present ?? stats.present);
    const late = (stats.total_late ?? stats.late);
    const absent = (stats.total_absent ?? stats.absent);
    const rate = (stats.attendance_rate ?? 0);

    // If stats has all values, use them
    if ([present, late, absent].every((v) => v != null)) {
      return { present, late, absent, rate: Math.round(rate) };
    }

    // Fallback to records-based computation
    const recs = recordsData?.data || [];
    const fromRecords = {
      present: recs.filter((r) => r.status === 'PRESENT').length,
      late: recs.filter((r) => r.status === 'LATE').length,
      absent: recs.filter((r) => r.status === 'ABSENT').length,
      rate: Math.round(rate),
    };
    return fromRecords;
  }, [user?.role, statsData, recordsData]);

  // Debug logs (student only) to inspect data shapes driving metric cards
  useEffect(() => {
    if (user?.role === 'STUDENT') {
      console.log('[Reports] statsData', statsData);
      console.log('[Reports] statsData.data keys:', Object.keys(statsData?.data || {}));
      console.log('[Reports] statsData.data', statsData?.data);
      if (statsData?.data?.statistics) {
        console.log('[Reports] statsData.data.statistics keys:', Object.keys(statsData.data.statistics));
        console.log('[Reports] statsData.data.statistics', statsData.data.statistics);
      }
      console.log('[Reports] recordsData.data', recordsData?.data);
      console.log('[Reports] studentDerived', studentDerived);
      console.log('[Reports] dateRange', dateRange);
      console.log('[Reports] statsLoading', statsLoading);
      console.log('[Reports] recordsLoading', recordsLoading);
    }
  }, [user?.role, statsData, recordsData, studentDerived, dateRange, statsLoading, recordsLoading]);

  const exportToCSV = () => {
    try {
      let csvContent = '';
      let data = [];

      if (reportType === 'summary' && statsData?.data) {
        if (user?.role === 'STUDENT') {
          const stats = statsData.data;
          csvContent = 'Metric,Value\n';
          csvContent += `Attendance Rate,${stats.attendance_rate || 0}%\n`;
          csvContent += `Present,${stats.total_present || 0}\n`;
          csvContent += `Late,${stats.total_late || 0}\n`;
          csvContent += `Absent,${stats.total_absent || 0}\n`;
          csvContent += `Total Classes,${stats.total_classes || 0}\n`;
        } else {
          const report = statsData.data;
          csvContent =
            'Date,Present Count,Absent Count,Late Count,Excused Count,Total Students,Attendance Percentage,Average Attendance Rate\n';
          (report.daily_attendance || []).forEach((day) => {
            csvContent += `${day.date},${day.present_count || 0},${day.absent_count || 0},${day.late_count || 0},${day.excused_count || 0},${day.total_students || 0},${Math.round(day.attendance_percentage || 0)}%,${Math.round(report.overall_statistics?.average_attendance_rate || 0)}%\n`;
          });
          
          // Add overall statistics section
          csvContent += '\nOverall Statistics\n';
          csvContent += 'Metric,Value\n';
          const overall = report.overall_statistics || {};
          csvContent += `Total Classes,${overall.total_classes || 0}\n`;
          csvContent += `Total Attendance Records,${overall.total_attendance_records || 0}\n`;
          csvContent += `Average Attendance Rate,${overall.average_attendance_rate || 0}%\n`;
        }
      } else if (reportType === 'detailed' && recordsData?.data) {
        csvContent = 'Student ID,Student Name,Email,Course,Date,Time,Status,Method,Is Late,Manual Override\n';
        recordsData.data.forEach((record) => {
          csvContent += `${record.student_id || 'N/A'},"${record.student_name || 'N/A'}","${record.student_email || 'N/A'}","${record.course_title || 'N/A'}",${record.date || 'N/A'},${record.time || 'N/A'},${record.status || 'N/A'},${record.method || 'N/A'},${record.is_late ? 'Yes' : 'No'},${record.is_manual_override ? 'Yes' : 'No'}\n`;
        });
      } else if (
        reportType === 'detailed' &&
        statsData?.data &&
        user?.role !== 'STUDENT'
      ) {
        // For Admin/Faculty, export comprehensive student data
        const report = statsData.data;
        csvContent = 'Most Absent Students - Full Details\n';
        csvContent += 'Student ID,First Name,Last Name,Full Name,Email,Phone,Status,Group,Faculty,Absence Count,Total Classes,Attendance Rate\n';
        (report.most_absent_students || []).forEach((s) => {
          const fullName = `${s.student__user__first_name || ''} ${s.student__user__last_name || ''}`.trim();
          const attendanceRate = s.total_classes > 0 ? Math.round(((s.total_classes - s.absence_count) / s.total_classes) * 100) : 0;
          csvContent += `${s.student__student_id || 'N/A'},"${s.student__user__first_name || 'N/A'}","${s.student__user__last_name || 'N/A'}","${fullName}","${s.student__user__email || 'N/A'}","${s.student__user__phone || 'N/A'}","${s.student__status || 'N/A'}","${s.student__group__name || 'N/A'}","${s.student__group__faculty || 'N/A'}",${s.absence_count || 0},${s.total_classes || 0},${attendanceRate}%\n`;
        });
        
        csvContent += '\nPunctuality Distribution - Detailed\n';
        csvContent += 'Status,Count,Percentage,Description\n';
        const totalPunctuality = (report.punctuality_distribution || []).reduce((sum, p) => sum + (p.count || 0), 0);
        (report.punctuality_distribution || []).forEach((p) => {
          const percentage = totalPunctuality > 0 ? Math.round((p.count / totalPunctuality) * 100) : 0;
          const description = p.status === 'PRESENT' ? 'On Time' : 
                           p.status === 'LATE' ? 'Arrived Late' :
                           p.status === 'ABSENT' ? 'Did Not Attend' :
                           p.status === 'EXCUSED' ? 'Excused Absence' : 'Unknown';
          csvContent += `${p.status},${p.count},${percentage}%,"${description}"\n`;
        });
        
        // Add overall statistics if available
        if (report.overall_statistics) {
          csvContent += '\nOverall Statistics\n';
          csvContent += 'Metric,Value\n';
          const overall = report.overall_statistics;
          csvContent += `Total Classes,${overall.total_classes || 0}\n`;
          csvContent += `Total Students,${overall.total_students || 0}\n`;
          csvContent += `Total Attendance Records,${overall.total_attendance_records || 0}\n`;
          csvContent += `Average Attendance Rate,${overall.average_attendance_rate || 0}%\n`;
          csvContent += `Most Punctual Class,${overall.best_attendance_date || 'N/A'}\n`;
          csvContent += `Least Punctual Class,${overall.worst_attendance_date || 'N/A'}\n`;
        }
      }

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute(
        'download',
        `attendance_report_${dateRange.startDate}_to_${dateRange.endDate}.csv`
      );
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Report exported successfully');
    } catch (error) {
      toast.error('Failed to export report');
    }
  };

  const exportToPDF = () => {
    try {
      const doc = new jsPDF();
      
      // Check if autoTable is available on the doc instance (v3.8.2 style)
      if (typeof doc.autoTable !== 'function') {
        console.error('autoTable plugin not available on doc instance');
        toast.error('PDF export functionality unavailable');
        return;
      }

      // Header
      doc.setFontSize(20);
      doc.text('Attendance Report', 20, 20);

      doc.setFontSize(12);
      doc.text(
        `Period: ${dateRange.startDate} to ${dateRange.endDate}`,
        20,
        35
      );

      if (user?.role !== 'STUDENT' && selectedGroup) {
        const groupName =
          groupsData?.find((g) => g.id.toString() === selectedGroup)?.name ||
          'Unknown';
        doc.text(`Group: ${groupName}`, 20, 45);
      }

      if (reportType === 'summary' && statsData?.data) {
        if (user?.role === 'STUDENT') {
          const stats = statsData.data;
          // Summary stats (student)
          doc.text('Summary Statistics:', 20, 60);
          doc.text(`Total Present: ${stats.total_present || 0}`, 30, 75);
          doc.text(`Total Absent: ${stats.total_absent || 0}`, 30, 85);
          doc.text(`Total Late: ${stats.total_late || 0}`, 30, 95);
          doc.text(`Attendance Rate: ${stats.attendance_rate || 0}%`, 30, 105);
        } else {
          const report = statsData.data;
          const overall = report.overall_statistics || {};
          // Summary stats (admin/faculty)
          doc.text('Summary Statistics:', 20, 60);
          doc.text(`Total Classes: ${overall.total_classes || 0}`, 30, 75);
          doc.text(
            `Total Records: ${overall.total_attendance_records || 0}`,
            30,
            85
          );
          doc.text(
            `Average Attendance Rate: ${overall.average_attendance_rate || 0}%`,
            30,
            95
          );

          // Daily breakdown
          if (report.daily_attendance && report.daily_attendance.length > 0) {
            const tableData = report.daily_attendance.map((day) => [
              day.date,
              String(day.present_count ?? 0),
              String(day.absent_count ?? 0),
              String(day.late_count ?? 0),
              String(day.excused_count ?? 0),
              String(day.total_students ?? 0),
              `${Math.round(day.attendance_percentage ?? 0)}%`,
            ]);

            doc.autoTable({
              head: [
                [
                  'Date',
                  'Present',
                  'Absent',
                  'Late',
                  'Excused',
                  'Total Students',
                  'Attendance %',
                ],
              ],
              body: tableData,
              startY: 110,
            });
          }
        }
      } else if (reportType === 'detailed' && recordsData?.data) {
        const tableData = recordsData.data.map((record) => [
          record.student_id || 'N/A',
          record.student_name || 'N/A',
          record.student_email || 'N/A',
          record.course_title || 'N/A',
          record.date || 'N/A',
          record.time || 'N/A',
          record.status || 'N/A',
          record.method || 'N/A',
          record.is_late ? 'Yes' : 'No',
          record.is_manual_override ? 'Yes' : 'No',
        ]);

        doc.autoTable({
          head: [['Student ID', 'Student Name', 'Email', 'Course', 'Date', 'Time', 'Status', 'Method', 'Late', 'Manual']],
          body: tableData,
          startY: 60,
          styles: { fontSize: 8 },
          headStyles: { fontSize: 9 },
          columnStyles: {
            0: { cellWidth: 15 }, // Student ID
            1: { cellWidth: 25 }, // Student Name
            2: { cellWidth: 30 }, // Email
            3: { cellWidth: 20 }, // Course
            4: { cellWidth: 15 }, // Date
            5: { cellWidth: 12 }, // Time
            6: { cellWidth: 15 }, // Status
            7: { cellWidth: 15 }, // Method
            8: { cellWidth: 10 }, // Late
            9: { cellWidth: 12 }, // Manual
          },
        });

        doc.text(
          `Total records: ${recordsData.data.length}`,
          20,
          doc.lastAutoTable.finalY + 10
        );
      } else if (
        reportType === 'detailed' &&
        !recordsData?.data &&
        statsData?.data &&
        user?.role !== 'STUDENT'
      ) {
        const report = statsData.data;
        // Top absentees table
        if (
          report.most_absent_students &&
          report.most_absent_students.length > 0
        ) {
          const tableData = report.most_absent_students.map((s) => [
            s.student__student_id,
            `${s.student__user__first_name} ${s.student__user__last_name}`,
            s.student__user__email,
            String(s.absence_count),
          ]);
          doc.autoTable({
            head: [
              [
                'Student ID',
                'Student Name',
                'Email',
                'Absence Count',
              ],
            ],
            body: tableData,
            startY: 60,
          });
        }
        // Punctuality distribution table
        if (
          report.punctuality_distribution &&
          report.punctuality_distribution.length > 0
        ) {
          const startY = doc.lastAutoTable?.finalY
            ? doc.lastAutoTable.finalY + 10
            : 60;
          const tableData2 = report.punctuality_distribution.map((p) => [
            p.status,
            String(p.count),
          ]);
          doc.autoTable({
            head: [['Status', 'Count']],
            body: tableData2,
            startY,
          });
        }
      } else if (reportType === 'detailed' && !recordsData?.data) {
        // No detailed records available
        doc.text('No detailed attendance records available for the selected period.', 20, 60);
        doc.text('Please try selecting a different date range or ensure there are attendance records.', 20, 75);
      }

      doc.save(
        `attendance_report_${dateRange.startDate}_to_${dateRange.endDate}.pdf`
      );
      toast.success('PDF exported successfully');
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('Failed to export PDF: ' + (error.message || 'Unknown error'));
    }
  };

  if (statsError) {
    return (
      <div className="p-6">
        <div className="rounded-md border border-red-200 bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Error Loading Reports
              </h3>
              <div className="mt-2 text-sm text-red-700">
                {statsError.response?.data?.error || statsError.message}
              </div>
              {user?.role !== 'STUDENT' && !selectedGroup && (
                <div className="mt-2 text-sm text-red-700">
                  Please select a group to view attendance reports.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Attendance Reports
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            {user?.role === 'STUDENT'
              ? 'View your attendance records and statistics'
              : user?.role === 'FACULTY'
                ? 'View attendance reports for your assigned groups'
                : 'View comprehensive attendance reports for all groups'}
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <div className="flex space-x-3">
            <button
              onClick={exportToCSV}
              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            >
              <DocumentArrowDownIcon className="mr-2 h-4 w-4" />
              Export CSV
            </button>
            <button
              onClick={exportToPDF}
              className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
            >
              <DocumentArrowDownIcon className="mr-2 h-4 w-4" />
              Export PDF
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-lg bg-white shadow">
        <div className="p-3 md:p-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Start Date
              </label>
              <div className="relative mt-1">
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) =>
                    handleDateChange('startDate', e.target.value)
                  }
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
                <CalendarIcon className="pointer-events-none absolute right-3 top-2 h-5 w-5 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                End Date
              </label>
              <div className="relative mt-1">
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => handleDateChange('endDate', e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
                <CalendarIcon className="pointer-events-none absolute right-3 top-2 h-5 w-5 text-gray-400" />
              </div>
            </div>

            {/* Group Selection (Admin and Faculty only) */}
            {user?.role !== 'STUDENT' && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {user?.role === 'FACULTY' ? 'Your Groups' : 'Select Group'}
                </label>
                <div className="relative mt-1">
                  <select
                    value={selectedGroup}
                    onChange={(e) => setSelectedGroup(e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value="">Select a group...</option>
                    {groupsData?.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.name} ({group.code})
                      </option>
                    ))}
                  </select>
                  <UserGroupIcon className="pointer-events-none absolute right-8 top-2 h-5 w-5 text-gray-400" />
                </div>
              </div>
            )}

            {/* Report Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Report Type
              </label>
              <div className="relative mt-1">
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="summary">Summary</option>
                  <option value="detailed">Detailed Records</option>
                </select>
                <ChartBarIcon className="pointer-events-none absolute right-8 top-2 h-5 w-5 text-gray-400" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {user?.role !== 'STUDENT' && !selectedGroup && (
        <div className="mt-4 rounded-md border border-yellow-200 bg-yellow-50 p-4 text-yellow-800">
          Please select a group to view attendance reports.
        </div>
      )}

      {/* Statistics Cards */}
      {reportType === 'summary' && statsData?.data && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="overflow-hidden rounded-lg bg-white shadow">
            <div className="p-3 md:p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <AcademicCapIcon className="h-6 w-6 text-green-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="truncate text-sm font-medium text-gray-500">
                      {user?.role === 'STUDENT' ? 'Days Present' : 'Total Present'}
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {user?.role === 'STUDENT'
                        ? (studentDerived?.present ?? 0)
                        : (statsData.data.overall_statistics?.total_attendance_records || 0)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg bg-white shadow">
            <div className="p-3 md:p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ClockIcon className="h-6 w-6 text-yellow-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="truncate text-sm font-medium text-gray-500">
                      {user?.role === 'STUDENT' ? 'Late Arrivals' : 'Total Late'}
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {user?.role === 'STUDENT'
                        ? (studentDerived?.late ?? 0)
                        : (statsData.data.daily_attendance || []).reduce((sum, d) => sum + (d.late_count || 0), 0)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg bg-white shadow">
            <div className="p-3 md:p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-400">
                    <span className="text-xs font-bold text-white">X</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="truncate text-sm font-medium text-gray-500">
                      {user?.role === 'STUDENT' ? 'Days Absent' : 'Total Absent'}
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {user?.role === 'STUDENT'
                        ? (studentDerived?.absent ?? 0)
                        : (statsData.data.daily_attendance || []).reduce((sum, d) => sum + (d.absent_count || 0), 0)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg bg-white shadow">
            <div className="p-3 md:p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-400">
                    <span className="text-xs font-bold text-white">%</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="truncate text-sm font-medium text-gray-500">
                      Attendance Rate
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {user?.role === 'STUDENT'
                        ? (studentDerived?.rate ?? 0)
                        : Math.round(statsData.data.overall_statistics?.average_attendance_rate || 0)}%
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {reportType === 'detailed' &&
        user?.role !== 'STUDENT' &&
        statsData?.data &&
        !statsLoading && (
          <div className="space-y-6">
            {/* Most Absent Students */}
            <div className="rounded-lg bg-white shadow">
              <div className="border-b border-gray-200 px-6 py-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Most Absent Students (Top 10)
                </h3>
              </div>
              <div className="overflow-x-auto">
                {statsData.data.most_absent_students &&
                statsData.data.most_absent_students.length > 0 ? (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                          Student ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                          First Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                          Last Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                          Absence Count
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {statsData.data.most_absent_students.map((s, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                            {s.student__student_id}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                            {s.student__user__first_name}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                            {s.student__user__last_name}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                            {s.student__user__email}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                            {s.absence_count}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="py-12 text-center">
                    <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                      No absent student insights
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      No absence data found for the selected period.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Punctuality Distribution */}
            <div className="rounded-lg bg-white shadow">
              <div className="border-b border-gray-200 px-6 py-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Punctuality Distribution
                </h3>
              </div>
              <div className="overflow-x-auto">
                {statsData.data.punctuality_distribution &&
                statsData.data.punctuality_distribution.length > 0 ? (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                          Count
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {statsData.data.punctuality_distribution.map((p, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                            {p.status}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                            {p.count}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="py-12 text-center">
                    <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                      No punctuality insights
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      No punctuality data found for the selected period.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      {/* Loading States */}
      {(statsLoading || recordsLoading) && (
        <div className="flex h-64 items-center justify-center">
          <LoadingSpinner />
        </div>
      )}

      {/* Summary Report */}
      {reportType === 'summary' && statsData?.data && !statsLoading && (
        <div className="rounded-lg bg-white shadow">
          <div className="border-b border-gray-200 px-6 py-4">
            <h3 className="text-lg font-medium text-gray-900">
              Daily Attendance Summary
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Present
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Late
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Absent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Total
                  </th>
                  {user?.role !== 'STUDENT' && (
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Attendance %
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {(user?.role === 'STUDENT'
                  ? []
                  : statsData.data.daily_attendance || []
                ).map((day, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                      {day.date}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-green-600">
                      {day.present_count}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-yellow-600">
                      {day.late_count}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-red-600">
                      {day.absent_count}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                      {day.total_students}
                    </td>
                    {user?.role !== 'STUDENT' && (
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                        {Math.round(day.attendance_percentage || 0)}%
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>

            {user?.role !== 'STUDENT' &&
              (!statsData.data.daily_attendance ||
                statsData.data.daily_attendance.length === 0) && (
                <div className="py-12 text-center">
                  <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    No data available
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    No attendance data found for the selected period.
                  </p>
                </div>
              )}
          </div>
        </div>
      )}

      {/* Detailed / Insights */}
      {reportType === 'detailed' &&
        user?.role === 'STUDENT' &&
        recordsData?.data &&
        !recordsLoading && (
          <div className="rounded-lg bg-white shadow">
            <div className="border-b border-gray-200 px-6 py-4">
              <h3 className="text-lg font-medium text-gray-900">
                Detailed Attendance Records
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {user?.role !== 'STUDENT' && (
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Student
                      </th>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Method
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {recordsData.data.map((record, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      {user?.role !== 'STUDENT' && (
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                          {record.student_name || 'N/A'}
                        </td>
                      )}
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                        {record.date}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                        {record.time}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                            record.status === 'PRESENT'
                              ? 'bg-green-100 text-green-800'
                              : record.status === 'LATE'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {record.status}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {record.method || 'Manual'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {recordsData.data.length === 0 && (
                <div className="py-12 text-center">
                  <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    No records found
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    No attendance records found for the selected period.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
    </div>
  );
};

export default AttendanceReports;
