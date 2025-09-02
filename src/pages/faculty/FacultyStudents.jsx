import { useEffect, useMemo, useState } from 'react';
import { userApi } from '../../api/axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const defaultColumns = [
  { key: 'student_id', label: 'Student ID' },
  { key: 'full_name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'group', label: 'Group' },
  { key: 'department', label: 'Department' },
];

function normalizeStudent(item) {
  // Try to normalize backend variations into a flat shape the table can use safely
  const groupName =
    item?.group?.name ||
    item?.assigned_group?.name ||
    item?.group_name ||
    item?.assigned_group_name ||
    '-';
  const name =
    item?.full_name ||
    item?.name ||
    [item?.first_name, item?.last_name].filter(Boolean).join(' ') ||
    '-';
  return {
    id: item.id ?? item.student_id ?? `${item?.user || 'row'}-${Math.random()}`,
    student_id:
      item.student_id || item?.user?.student_id || item?.user?.username || '-',
    full_name: name,
    email: item.email || item?.user?.email || '-',
    group: groupName,
    department: item.department || item?.user?.department || '-',
    raw: item,
  };
}

const pageSizes = [10, 20, 50];

export default function FacultyStudents() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [students, setStudents] = useState([]);

  // Client-side controls
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Attempt to load from a likely endpoint; adjust when backend is ready
  const fetchStudents = async () => {
    setIsLoading(true);
    setError('');
    try {
      // Use the userApi method instead of direct URL
      const response = await userApi.getFacultyStudents({ search });
      const results = response?.results || [];
      const normalized = results.map(normalizeStudent);
      setStudents(normalized);
    } catch (e) {
      setError(e?.message || 'Failed to load students');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const filtered = useMemo(() => {
    const term = (search || '').toLowerCase();
    if (!term) return students;
    return students.filter((s) =>
      [s.student_id, s.full_name, s.email, s.group, s.department]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(term))
    );
  }, [students, search]);

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-white p-4 shadow">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Search
            </label>
            <input
              type="text"
              placeholder="Search by name, ID, email, group..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Rows</label>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="rounded-md border border-gray-300 px-2 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
            >
              {pageSizes.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <button
              onClick={() => {
                setSearch('');
                setPage(1);
                setPageSize(20);
              }}
              className="rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg bg-white shadow">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <div className="p-6 text-sm text-red-600">{error}</div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {defaultColumns.map((col) => (
                    <th
                      key={col.key}
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {paginated.length === 0 ? (
                  <tr>
                    <td
                      className="px-6 py-8 text-center text-sm text-gray-500"
                      colSpan={defaultColumns.length}
                    >
                      No students found
                    </td>
                  </tr>
                ) : (
                  paginated.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                        {s.student_id}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                        {s.full_name}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                        {s.email}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                        {s.group}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                        {s.department}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Page {page} of {totalPages} • {filtered.length} total
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
