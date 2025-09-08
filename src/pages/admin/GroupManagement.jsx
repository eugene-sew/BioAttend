import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { groupsApi } from '../../api/axios';
import toast from 'react-hot-toast';

const emptyForm = {
  id: null,
  name: '',
  academic_year: '',
  description: '',
};

export default function GroupManagement() {
  const qc = useQueryClient();
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState({ key: 'name', dir: 'asc' });
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { data: groups = [], isLoading } = useQuery({
    queryKey: ['groups', search],
    queryFn: async () => {
      const all = await groupsApi.list();
      if (!search) return all;
      const s = search.toLowerCase();
      return all.filter((g) => g.name.toLowerCase().includes(s));
    },
  });

  // Sorting
  const sorted = useMemo(() => {
    const arr = [...groups];
    arr.sort((a, b) => {
      const av = (a[sort.key] ?? '').toString().toLowerCase();
      const bv = (b[sort.key] ?? '').toString().toLowerCase();
      if (av < bv) return sort.dir === 'asc' ? -1 : 1;
      if (av > bv) return sort.dir === 'asc' ? 1 : -1;
      return 0;
    });
    return arr;
  }, [groups, sort]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, page]);

  useEffect(() => {
    // reset to page 1 when search changes
    setPage(1);
  }, [search]);

  const createMutation = useMutation({
    mutationFn: (payload) => groupsApi.create(payload),
    onSuccess: () => {
      toast.success('Group created');
      qc.invalidateQueries({ queryKey: ['groups'] });
      setForm(emptyForm);
    },
    onError: () => toast.error('Failed to create group'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => groupsApi.update(id, payload),
    onSuccess: () => {
      toast.success('Group updated');
      qc.invalidateQueries({ queryKey: ['groups'] });
      setForm(emptyForm);
    },
    onError: () => toast.error('Failed to update group'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => groupsApi.delete(id),
    onSuccess: () => {
      toast.success('Group deleted');
      qc.invalidateQueries({ queryKey: ['groups'] });
    },
    onError: () => toast.error('Failed to delete group'),
  });

  const editing = !!form.id;
  const canSubmit = useMemo(() => {
    if (!(form.name && form.academic_year)) return false;
    // Validate academic year: YYYY-YYYY and consecutive years
    const m = /^\d{4}-\d{4}$/.test(form.academic_year);
    if (!m) return false;
    const [y1, y2] = form.academic_year.split('-').map((n) => parseInt(n, 10));
    if (y2 !== y1 + 1) return false;
    return true;
  }, [form]);

  const onSubmit = (e) => {
    e.preventDefault();
    // Auto-generate code on create
    const generateCode = (name, year) => {
      const prefix =
        (name || '')
          .replace(/[^a-zA-Z0-9]/g, '')
          .toUpperCase()
          .slice(0, 4) || 'COUR';
      const startYear = (year || '').split('-')[0] || '0000';
      const rand = String(Math.floor(100 + Math.random() * 900));
      return `${prefix}${startYear}${rand}`; // e.g., COMP2024123
    };

    const payload = {
      name: form.name.trim(),
      academic_year: form.academic_year.trim(),
      description: form.description?.trim() || '',
    };
    if (editing) {
      updateMutation.mutate({ id: form.id, payload });
    } else {
      const createPayload = {
        ...payload,
        code: generateCode(form.name, form.academic_year),
      };
      createMutation.mutate(createPayload);
    }
  };

  return (
    <div className="p-2 py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Course Management</h1>
        <div className="w-64">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search groups..."
            className="w-full rounded-md border border-gray-300 px-3 py-2"
          />
        </div>
      </div>

      {/* Form */}
      <div className="mb-6 rounded-md bg-white p-4 shadow">
        <form
          onSubmit={onSubmit}
          className="grid grid-cols-1 gap-4 md:grid-cols-2"
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Course Name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full rounded-md border border-gray-300 px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Academic Year
            </label>
            <input
              type="text"
              placeholder="2024-2025"
              value={form.academic_year}
              onChange={(e) =>
                setForm((f) => ({ ...f, academic_year: e.target.value }))
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2"
              required
            />
            {form.academic_year &&
              !/^\d{4}-\d{4}$/.test(form.academic_year) && (
                <p className="mt-1 text-xs text-red-600">
                  Use format YYYY-YYYY
                </p>
              )}
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </div>
          <div className="flex justify-end gap-2 md:col-span-2">
            {editing && (
              <button
                type="button"
                onClick={() => setForm(emptyForm)}
                className="rounded-md border px-4 py-2"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={
                !canSubmit ||
                createMutation.isPending ||
                updateMutation.isPending
              }
              className="rounded-md bg-indigo-600 px-4 py-2 text-white disabled:opacity-50"
            >
              {editing ? 'Update Course' : 'Create Course'}
            </button>
          </div>
        </form>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-md bg-white shadow">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th
                className="cursor-pointer px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                onClick={() =>
                  setSort((s) => ({
                    key: 'name',
                    dir: s.key === 'name' && s.dir === 'asc' ? 'desc' : 'asc',
                  }))
                }
              >
                Course
              </th>
              <th
                className="cursor-pointer px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                onClick={() =>
                  setSort((s) => ({
                    key: 'academic_year',
                    dir:
                      s.key === 'academic_year' && s.dir === 'asc'
                        ? 'desc'
                        : 'asc',
                  }))
                }
              >
                Year
              </th>
              <th className="px-4 py-2 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td className="px-4 py-6" colSpan={5}>
                  Loading...
                </td>
              </tr>
            ) : groups.length === 0 ? (
              <tr>
                <td className="px-4 py-6" colSpan={5}>
                  No groups found
                </td>
              </tr>
            ) : (
              paged.map((g) => (
                <tr key={g.id}>
                  <td className="px-4 py-2">{g.name}</td>
                  <td className="px-4 py-2">{g.academic_year}</td>
                  <td className="space-x-2 px-4 py-2 text-right">
                    <button
                      className="rounded-md border px-3 py-1 text-sm"
                      onClick={() => setForm({ ...g })}
                    >
                      Edit
                    </button>
                    <button
                      className="rounded-md border border-red-300 px-3 py-1 text-sm text-red-600"
                      onClick={() => {
                        if (confirm('Delete this group?'))
                          deleteMutation.mutate(g.id);
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {/* Pagination controls */}
        <div className="flex items-center justify-between border-t px-4 py-3">
          <div className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </div>
          <div className="space-x-2">
            <button
              className="rounded border px-3 py-1 disabled:opacity-50"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </button>
            <button
              className="rounded border px-3 py-1 disabled:opacity-50"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
