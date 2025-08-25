import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { attendanceApi } from '../../api/axios';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const AttendanceReports = () => {
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedRole, setSelectedRole] = useState('all');
  const [reportType, setReportType] = useState('summary'); // summary, detailed, individual

  // Fetch attendance statistics
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['attendance-stats', dateRange, selectedDepartment, selectedRole],
    queryFn: () => attendanceApi.getStatistics({
      from: dateRange.startDate,
      to: dateRange.endDate,
      department: selectedDepartment === 'all' ? undefined : selectedDepartment,
      role: selectedRole === 'all' ? undefined : selectedRole
    })
  });

  // Fetch detailed attendance records
  const { data: recordsData, isLoading: recordsLoading } = useQuery({
    queryKey: ['attendance-records', dateRange, selectedDepartment, selectedRole],
    queryFn: () => attendanceApi.getRecords({
      from: dateRange.startDate,
      to: dateRange.endDate,
      department: selectedDepartment === 'all' ? undefined : selectedDepartment,
      role: selectedRole === 'all' ? undefined : selectedRole
    }),
    enabled: reportType === 'detailed'
  });

  const handleDateChange = (field, value) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const exportToCSV = () => {
    try {
      let csvContent = '';
      let data = [];
      let headers = [];

      if (reportType === 'summary') {
        headers = ['Metric', 'Value'];
        data = [
          ['Total Users', statsData?.total_users || 0],
          ['Average Attendance Rate', `${statsData?.average_attendance_rate || 0}%`],
          ['Total Present Days', statsData?.total_present || 0],
          ['Total Absent Days', statsData?.total_absent || 0],
          ['Total Late Arrivals', statsData?.total_late || 0],
          ['Most Punctual Department', statsData?.most_punctual_department || 'N/A'],
          ['Report Period', `${dateRange.startDate} to ${dateRange.endDate}`]
        ];
      } else if (reportType === 'detailed' && recordsData?.results) {
        headers = ['Date', 'Name', 'Email', 'Department', 'Check In', 'Check Out', 'Status', 'Duration'];
        data = recordsData.results.map(record => [
          new Date(record.date).toLocaleDateString(),
          `${record.user?.first_name} ${record.user?.last_name}`,
          record.user?.email,
          record.user?.department || 'N/A',
          record.check_in_time || 'N/A',
          record.check_out_time || 'N/A',
          record.status,
          record.duration || 'N/A'
        ]);
      }

      // Build CSV content
      csvContent = headers.join(',') + '\n';
      data.forEach(row => {
        csvContent += row.map(cell => `"${cell}"`).join(',') + '\n';
      });

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `attendance_report_${dateRange.startDate}_${dateRange.endDate}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Report exported to CSV successfully');
    } catch (error) {
      toast.error('Failed to export CSV');
      console.error('Export error:', error);
    }
  };

  const exportToPDF = () => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      
      // Add header
      doc.setFontSize(20);
      doc.text('Attendance Report', pageWidth / 2, 20, { align: 'center' });
      
      doc.setFontSize(12);
      doc.text(`Period: ${dateRange.startDate} to ${dateRange.endDate}`, pageWidth / 2, 30, { align: 'center' });
      
      if (reportType === 'summary') {
        // Summary statistics
        doc.setFontSize(14);
        doc.text('Summary Statistics', 20, 45);
        
        const summaryData = [
          ['Total Users', statsData?.total_users || 0],
          ['Average Attendance Rate', `${statsData?.average_attendance_rate || 0}%`],
          ['Total Present Days', statsData?.total_present || 0],
          ['Total Absent Days', statsData?.total_absent || 0],
          ['Total Late Arrivals', statsData?.total_late || 0],
          ['Most Punctual Department', statsData?.most_punctual_department || 'N/A']
        ];
        
        doc.autoTable({
          startY: 50,
          head: [['Metric', 'Value']],
          body: summaryData,
          theme: 'grid',
          headStyles: { fillColor: [79, 70, 229] }
        });

        // Add charts section if data available
        if (statsData?.daily_attendance) {
          doc.addPage();
          doc.setFontSize(14);
          doc.text('Daily Attendance Trend', 20, 20);
          
          const dailyData = Object.entries(statsData.daily_attendance).map(([date, count]) => [
            new Date(date).toLocaleDateString(),
            count
          ]);
          
          doc.autoTable({
            startY: 30,
            head: [['Date', 'Attendance Count']],
            body: dailyData,
            theme: 'grid',
            headStyles: { fillColor: [79, 70, 229] }
          });
        }
      } else if (reportType === 'detailed' && recordsData?.results) {
        // Detailed records
        doc.setFontSize(14);
        doc.text('Detailed Attendance Records', 20, 45);
        
        const tableData = recordsData.results.map(record => [
          new Date(record.date).toLocaleDateString(),
          `${record.user?.first_name} ${record.user?.last_name}`,
          record.user?.department || 'N/A',
          record.check_in_time || 'N/A',
          record.check_out_time || 'N/A',
          record.status
        ]);
        
        doc.autoTable({
          startY: 50,
          head: [['Date', 'Name', 'Department', 'Check In', 'Check Out', 'Status']],
          body: tableData,
          theme: 'grid',
          headStyles: { fillColor: [79, 70, 229] },
          styles: { fontSize: 8 }
        });
      }
      
      // Save PDF
      doc.save(`attendance_report_${dateRange.startDate}_${dateRange.endDate}.pdf`);
      toast.success('Report exported to PDF successfully');
    } catch (error) {
      toast.error('Failed to export PDF');
      console.error('Export error:', error);
    }
  };

  const stats = statsData || {};
  const records = recordsData?.results || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Attendance Reports</h2>
        
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => handleDateChange('startDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => handleDateChange('endDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Department
            </label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">All Departments</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Engineering">Engineering</option>
              <option value="Business">Business</option>
              <option value="Arts">Arts</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">All Roles</option>
              <option value="STUDENT">Students</option>
              <option value="FACULTY">Faculty</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Report Type
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="summary">Summary</option>
              <option value="detailed">Detailed</option>
              <option value="individual">Individual</option>
            </select>
          </div>
        </div>

        {/* Export Buttons */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={exportToCSV}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            <span className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export CSV
            </span>
          </button>
          <button
            onClick={exportToPDF}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            <span className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Export PDF
            </span>
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      {reportType === 'summary' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-5">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Average Attendance
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {stats.average_attendance_rate || 0}%
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div className="ml-5">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Present
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {stats.total_present || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-red-500 rounded-md p-3">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div className="ml-5">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Absent
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {stats.total_absent || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-5">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Late Arrivals
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {stats.total_late || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Table */}
      {reportType === 'detailed' && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Detailed Attendance Records</h3>
          
          {recordsLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Check In
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Check Out
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {records.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(record.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-indigo-500 flex items-center justify-center">
                              <span className="text-white font-medium">
                                {record.user?.first_name?.[0]}{record.user?.last_name?.[0]}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {record.user?.first_name} {record.user?.last_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {record.user?.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.user?.department || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.check_in_time || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.check_out_time || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                          ${record.status === 'PRESENT' ? 'bg-green-100 text-green-800' : 
                            record.status === 'ABSENT' ? 'bg-red-100 text-red-800' :
                            record.status === 'LATE' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'}`}>
                          {record.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.duration || 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Chart Section */}
      {reportType === 'summary' && statsData?.daily_attendance && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Daily Attendance Trend</h3>
          <div className="h-64 flex items-center justify-center text-gray-500">
            {/* Placeholder for chart - you can integrate a charting library like recharts */}
            <p>Chart visualization would go here (integrate with recharts or chart.js)</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceReports;
