import AttendanceReports from '../admin/AttendanceReports';

// Student uses the same component as admin, but with role-based restrictions
const StudentAttendanceReports = () => {
  return <AttendanceReports />;
};

export default StudentAttendanceReports;
