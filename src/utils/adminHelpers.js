/**
 * Admin Dashboard Helper Functions
 */

/**
 * Format date to display string
 * @param {string|Date} date - Date to format
 * @param {string} format - Format type: 'short', 'long', 'time'
 * @returns {string} Formatted date string
 */
export const formatDate = (date, format = 'short') => {
  if (!date) return 'N/A';
  
  const dateObj = new Date(date);
  
  switch (format) {
    case 'short':
      return dateObj.toLocaleDateString();
    case 'long':
      return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    case 'time':
      return dateObj.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    case 'datetime':
      return `${dateObj.toLocaleDateString()} ${dateObj.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      })}`;
    default:
      return dateObj.toLocaleDateString();
  }
};

/**
 * Calculate attendance percentage
 * @param {number} present - Number of present days
 * @param {number} total - Total days
 * @returns {number} Attendance percentage
 */
export const calculateAttendancePercentage = (present, total) => {
  if (total === 0) return 0;
  return Math.round((present / total) * 100);
};

/**
 * Get status color class
 * @param {string} status - Status type
 * @returns {string} Tailwind color classes
 */
export const getStatusColor = (status) => {
  const statusColors = {
    PRESENT: 'bg-green-100 text-green-800',
    ABSENT: 'bg-red-100 text-red-800',
    LATE: 'bg-yellow-100 text-yellow-800',
    EXCUSED: 'bg-blue-100 text-blue-800',
    ACTIVE: 'bg-green-100 text-green-800',
    INACTIVE: 'bg-gray-100 text-gray-800',
    PENDING: 'bg-yellow-100 text-yellow-800',
    APPROVED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800'
  };
  
  return statusColors[status?.toUpperCase()] || 'bg-gray-100 text-gray-800';
};

/**
 * Get role badge color
 * @param {string} role - User role
 * @returns {string} Tailwind color classes
 */
export const getRoleColor = (role) => {
  const roleColors = {
    ADMIN: 'bg-purple-100 text-purple-800',
    FACULTY: 'bg-blue-100 text-blue-800',
    STUDENT: 'bg-green-100 text-green-800',
    STAFF: 'bg-indigo-100 text-indigo-800'
  };
  
  return roleColors[role?.toUpperCase()] || 'bg-gray-100 text-gray-800';
};

/**
 * Generate CSV content from data
 * @param {Array} headers - Column headers
 * @param {Array} data - Data rows
 * @returns {string} CSV content
 */
export const generateCSV = (headers, data) => {
  let csvContent = headers.join(',') + '\n';
  
  data.forEach(row => {
    const escapedRow = row.map(cell => {
      // Escape quotes and wrap in quotes if contains comma
      const cellStr = String(cell || '');
      if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
        return `"${cellStr.replace(/"/g, '""')}"`;
      }
      return cellStr;
    });
    csvContent += escapedRow.join(',') + '\n';
  });
  
  return csvContent;
};

/**
 * Download file utility
 * @param {string} content - File content
 * @param {string} filename - Name of the file
 * @param {string} mimeType - MIME type of the file
 */
export const downloadFile = (content, filename, mimeType = 'text/csv') => {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up the URL object
  URL.revokeObjectURL(url);
};

/**
 * Format user name
 * @param {Object} user - User object
 * @returns {string} Formatted full name
 */
export const formatUserName = (user) => {
  if (!user) return 'Unknown';
  return `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email || 'Unknown';
};

/**
 * Parse and format time duration
 * @param {number} minutes - Duration in minutes
 * @returns {string} Formatted duration
 */
export const formatDuration = (minutes) => {
  if (!minutes || minutes < 0) return 'N/A';
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
};

/**
 * Get time difference in minutes
 * @param {string} startTime - Start time
 * @param {string} endTime - End time
 * @returns {number} Difference in minutes
 */
export const getTimeDifference = (startTime, endTime) => {
  if (!startTime || !endTime) return 0;
  
  const start = new Date(`1970-01-01T${startTime}`);
  const end = new Date(`1970-01-01T${endTime}`);
  
  return Math.round((end - start) / (1000 * 60));
};

/**
 * Group data by key
 * @param {Array} array - Array to group
 * @param {string} key - Key to group by
 * @returns {Object} Grouped object
 */
export const groupBy = (array, key) => {
  return array.reduce((result, item) => {
    const group = item[key] || 'Other';
    if (!result[group]) result[group] = [];
    result[group].push(item);
    return result;
  }, {});
};

/**
 * Calculate statistics from attendance data
 * @param {Array} records - Attendance records
 * @returns {Object} Statistics object
 */
export const calculateAttendanceStats = (records) => {
  if (!records || records.length === 0) {
    return {
      total: 0,
      present: 0,
      absent: 0,
      late: 0,
      excused: 0,
      attendanceRate: 0
    };
  }
  
  const stats = records.reduce((acc, record) => {
    acc.total++;
    switch (record.status?.toUpperCase()) {
      case 'PRESENT':
        acc.present++;
        break;
      case 'ABSENT':
        acc.absent++;
        break;
      case 'LATE':
        acc.late++;
        break;
      case 'EXCUSED':
        acc.excused++;
        break;
    }
    return acc;
  }, { total: 0, present: 0, absent: 0, late: 0, excused: 0 });
  
  stats.attendanceRate = calculateAttendancePercentage(
    stats.present + stats.late,
    stats.total
  );
  
  return stats;
};

/**
 * Sort data by multiple fields
 * @param {Array} data - Data to sort
 * @param {Array} fields - Fields to sort by (e.g., [{ key: 'name', order: 'asc' }])
 * @returns {Array} Sorted data
 */
export const multiSort = (data, fields) => {
  return [...data].sort((a, b) => {
    for (const field of fields) {
      const { key, order = 'asc' } = field;
      const aVal = a[key];
      const bVal = b[key];
      
      if (aVal === bVal) continue;
      
      const comparison = aVal > bVal ? 1 : -1;
      return order === 'asc' ? comparison : -comparison;
    }
    return 0;
  });
};

/**
 * Debounce function for search inputs
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export const debounce = (func, wait = 300) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} Is valid email
 */
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Generate random temporary password
 * @returns {string} Random password
 */
export const generateTempPassword = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

export default {
  formatDate,
  calculateAttendancePercentage,
  getStatusColor,
  getRoleColor,
  generateCSV,
  downloadFile,
  formatUserName,
  formatDuration,
  getTimeDifference,
  groupBy,
  calculateAttendanceStats,
  multiSort,
  debounce,
  validateEmail,
  generateTempPassword
};
