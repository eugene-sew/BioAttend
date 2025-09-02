import AttendanceReports from '../admin/AttendanceReports';

// Faculty uses the same component as admin, but with role-based restrictions
const FacultyAttendanceReports = () => {
  return <AttendanceReports />;
};

export default FacultyAttendanceReports;
