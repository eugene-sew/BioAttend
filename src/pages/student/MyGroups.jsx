import { useQuery } from '@tanstack/react-query';
import { groupsApi } from '../../api/axios';

export default function MyGroups() {
  const { data: groups = [], isLoading, isError } = useQuery({
    queryKey: ['my-groups-student'],
    queryFn: () => groupsApi.list(),
  });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">My Courses</h1>
      <div className="bg-white shadow rounded-md overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {isLoading ? (
              <tr><td colSpan={4} className="px-4 py-6">Loading...</td></tr>
            ) : isError ? (
              <tr><td colSpan={4} className="px-4 py-6">Failed to load courses</td></tr>
            ) : groups.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-6">No courses available</td></tr>
            ) : (
              groups.map((g) => (
                <tr key={g.id}>
                  <td className="px-4 py-2">{g.name}</td>
                  <td className="px-4 py-2">{g.code}</td>
                  <td className="px-4 py-2">{g.academic_year}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
