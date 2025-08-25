import React, { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { facultyApi } from '../../api/axios';
import { useNavigate } from 'react-router-dom';
 

export default function FacultyCourses() {
  const navigate = useNavigate();
  const [forbidden, setForbidden] = useState(false);

  const {
    data: groups = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['faculty', 'my-groups'],
    queryFn: facultyApi.getMyGroups,
    retry: false,
    onError: (err) => {
      const status = err?.response?.status;
      const data = err?.response?.data;
      console.error('[FacultyCourses] getMyGroups error:', status, data || err);
      if (status === 403) {
        setForbidden(true);
      }
    },
  });

  // No inline schedule creation here; redirect to schedules page

  const handleOpen = (group) => {
    console.log('[FacultyCourses] navigate to schedules for group:', group);
    // Pass initial data to schedules page to prefill title with course name
    navigate('/faculty/schedules', {
      state: {
        initSchedule: {
          title: group.name || group.code || 'New Schedule',
          assigned_group: group.id,
        },
        autoOpenForm: true,
      },
    });
  };

  // Inline form handlers removed; scheduling is managed on the schedules page

  // Inline submit removed

  const grouped = useMemo(() => groups, [groups]);

  useEffect(() => {
    console.log('[FacultyCourses] isLoading:', isLoading);
    console.log('[FacultyCourses] isError:', isError);
    console.log('[FacultyCourses] forbidden:', forbidden);
    if (groups) {
      console.log('[FacultyCourses] groups:', groups);
      if (Array.isArray(groups)) {
        try {
          console.table(groups.map(g => ({
            id: g.id,
            name: g.name,
            code: g.code,
            semester: g.semester,
            year: g.academic_year,
          })));
        } catch {
          // console.table may fail if data is not array-like
        }
      }
    }
  }, [isLoading, isError, forbidden, groups]);

  return (
    <div className="mx-auto max-w-5xl p-6">
      <h1 className="mb-4 text-2xl font-semibold">My Courses</h1>

      {forbidden && (
        <div className="rounded-md border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
          Access denied. You must be logged in as a Faculty user to view assigned courses.
        </div>
      )}

      {!forbidden && isLoading && <div>Loading...</div>}
      {!forbidden && isError && <div>Failed to load courses.</div>}

      {!forbidden && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {grouped.map((g) => (
            <div key={g.id} className="rounded-lg border bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-medium">{g.name}</div>
                  <div className="text-sm text-gray-600">Code: {g.code}</div>
                  <div className="text-sm text-gray-600">
                    Semester: {g.semester} | Year: {g.academic_year}
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleOpen(g)}
                className="mt-3 inline-flex items-center rounded bg-indigo-600 px-3 py-2 text-white hover:bg-indigo-700"
              >
                Create Schedule
              </button>
              {/* Inline form removed; redirecting to schedules page */}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
