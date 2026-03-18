import React, { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';
import { Card, CardHeader } from '../../components/Common/Card';
import { Button } from '../../components/Common/Button';
import { Badge } from '../../components/Common/Badge';
import { Modal } from '../../components/Common/Modal';
import { PageLoader } from '../../components/Common/LoadingSpinner';
import type { User } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { format } from 'date-fns';

export const AdminUsers: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ isAdmin: false, isBanned: false, isSubscribed: false, storageQuota: 1073741824 });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadUsers();
  }, [page, search]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await adminApi.listUsers({ page, limit: 20, search: search || undefined });
      setUsers(res.data.users || []);
      setTotal(res.data.total || 0);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setEditForm({
      isAdmin: user.isAdmin,
      isBanned: user.isBanned || false,
      isSubscribed: user.isSubscribed || false,
      storageQuota: user.storageQuota || 1073741824,
    });
  };

  const handleSave = async () => {
    if (!editingUser) return;
    setSaving(true);
    try {
      await adminApi.updateUser(editingUser.id, editForm);
      setEditingUser(null);
      await loadUsers();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Delete this user? This is irreversible.')) return;
    try {
      await adminApi.deleteUser(userId);
      await loadUsers();
    } catch {}
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title="Manage Users" subtitle={`${total} total users`} />

        <div className="mb-4">
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="input"
          />
        </div>

        {loading ? (
          <PageLoader />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 dark:text-zinc-500 border-b border-gray-100 dark:border-zinc-800">
                    <th className="pb-3 font-medium">User</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium hidden md:table-cell">Joined</th>
                    <th className="pb-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-zinc-800">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-brand-400 to-brand-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                            {user.username[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800 dark:text-zinc-200">{user.username}</p>
                            <p className="text-xs text-gray-400 dark:text-zinc-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="flex flex-wrap gap-1">
                          {user.isAdmin && <Badge variant="info">Admin</Badge>}
                          {user.isSubscribed && <Badge variant="success">Subscribed</Badge>}
                          {user.isBanned && <Badge variant="error">Banned</Badge>}
                          {!user.isAdmin && !user.isBanned && <Badge>User</Badge>}
                        </div>
                      </td>
                      <td className="py-3 text-gray-400 dark:text-zinc-500 hidden md:table-cell">
                        {user.createdAt ? format(new Date(user.createdAt), 'MMM d, yyyy') : '-'}
                      </td>
                      <td className="py-3">
                        <div className="flex gap-2">
                          <Button size="sm" variant="secondary" onClick={() => handleEdit(user)}>Edit</Button>
                          {user.id !== currentUser?.id && (
                            <Button size="sm" variant="danger" onClick={() => handleDelete(user.id)}>Delete</Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {total > 20 && (
              <div className="flex justify-center gap-2 mt-4">
                <Button size="sm" variant="secondary" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                  Previous
                </Button>
                <span className="text-sm text-gray-500 dark:text-zinc-400 px-3 py-1.5">
                  Page {page} of {Math.ceil(total / 20)}
                </span>
                <Button size="sm" variant="secondary" disabled={page >= Math.ceil(total / 20)} onClick={() => setPage(p => p + 1)}>
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Edit Modal */}
      <Modal isOpen={!!editingUser} onClose={() => setEditingUser(null)} title={`Edit ${editingUser?.username}`}>
        <div className="space-y-4">
          <label className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-zinc-300">Admin</span>
            <input
              type="checkbox"
              checked={editForm.isAdmin}
              onChange={(e) => setEditForm({ ...editForm, isAdmin: e.target.checked })}
              className="w-4 h-4 rounded text-brand-500"
            />
          </label>

          <label className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-zinc-300">Banned</span>
            <input
              type="checkbox"
              checked={editForm.isBanned}
              onChange={(e) => setEditForm({ ...editForm, isBanned: e.target.checked })}
              className="w-4 h-4 rounded text-red-500"
            />
          </label>

          <label className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-zinc-300">Subscribed</span>
            <input
              type="checkbox"
              checked={editForm.isSubscribed}
              onChange={(e) => setEditForm({ ...editForm, isSubscribed: e.target.checked })}
              className="w-4 h-4 rounded text-green-500"
            />
          </label>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5">Storage Quota (bytes)</label>
            <input
              type="number"
              value={editForm.storageQuota}
              onChange={(e) => setEditForm({ ...editForm, storageQuota: Number(e.target.value) })}
              className="input"
              min={0}
            />
            <p className="text-xs text-gray-400 mt-1">
              = {(editForm.storageQuota / 1024 / 1024 / 1024).toFixed(2)} GB
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button className="flex-1" onClick={handleSave} loading={saving}>Save Changes</Button>
            <Button variant="secondary" onClick={() => setEditingUser(null)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
