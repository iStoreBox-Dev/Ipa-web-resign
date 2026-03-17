import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { userApi, resignApi } from '../../services/api';
import { Card, CardHeader } from '../../components/Common/Card';
import { Button } from '../../components/Common/Button';
import { Badge, statusToBadge } from '../../components/Common/Badge';
import { PageLoader } from '../../components/Common/LoadingSpinner';
import type { ResignJob } from '../../types';
import { formatDistanceToNow, format } from 'date-fns';

export const AccountPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuth();
  const [jobs, setJobs] = useState<ResignJob[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [username, setUsername] = useState(user?.username || '');
  const [pwForm, setPwForm] = useState({ current: '', new: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      const res = await resignApi.list({ limit: 20 });
      setJobs(res.data.jobs || []);
    } finally {
      setLoadingJobs(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await userApi.updateProfile({ username });
      updateUser(res.data.user);
      setMessage('Profile updated');
      setEditMode(false);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.new !== pwForm.confirm) {
      setError('New passwords do not match');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await userApi.changePassword({ currentPassword: pwForm.current, newPassword: pwForm.new });
      setMessage('Password changed successfully');
      setPwForm({ current: '', new: '', confirm: '' });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = async (jobId: string) => {
    try {
      const res = await resignApi.download(jobId);
      const blob = new Blob([res.data], { type: 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `resigned-${jobId}.ipa`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {}
  };

  const storagePercent = user?.storageQuota
    ? Math.round(((user.usedStorage || 0) / user.storageQuota) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Profile Card */}
      <Card>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-brand-400 to-brand-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold">
              {user?.username?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{user?.username}</h2>
              <p className="text-sm text-gray-500 dark:text-zinc-400">{user?.email}</p>
              {user?.isAdmin && <Badge variant="info" className="mt-1">Admin</Badge>}
            </div>
          </div>
          <Button size="sm" variant="secondary" onClick={() => setEditMode(!editMode)}>
            {editMode ? 'Cancel' : 'Edit Profile'}
          </Button>
        </div>

        {message && (
          <div className="mb-4 px-4 py-3 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-xl">
            <p className="text-sm text-green-600 dark:text-green-400">{message}</p>
          </div>
        )}
        {error && (
          <div className="mb-4 px-4 py-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {editMode && (
          <form onSubmit={handleUpdateProfile} className="mb-5 p-4 bg-gray-50 dark:bg-zinc-800/50 rounded-xl space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input"
                required
                minLength={3}
              />
            </div>
            <Button type="submit" size="sm" loading={saving}>Save Changes</Button>
          </form>
        )}

        {/* Storage bar */}
        {user?.storageQuota && (
          <div className="p-4 bg-gray-50 dark:bg-zinc-800/50 rounded-xl">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600 dark:text-zinc-400">Storage</span>
              <span className="text-gray-500 dark:text-zinc-500">
                {((user.usedStorage || 0) / 1024 / 1024).toFixed(0)} MB / {(user.storageQuota / 1024 / 1024).toFixed(0)} MB
              </span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-zinc-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-500 rounded-full transition-all"
                style={{ width: `${Math.min(storagePercent, 100)}%` }}
              />
            </div>
          </div>
        )}
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader title="Change Password" />
        <form onSubmit={handleChangePassword} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5">Current Password</label>
            <input
              type="password"
              value={pwForm.current}
              onChange={(e) => setPwForm({ ...pwForm, current: e.target.value })}
              className="input"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5">New Password</label>
            <input
              type="password"
              value={pwForm.new}
              onChange={(e) => setPwForm({ ...pwForm, new: e.target.value })}
              className="input"
              required
              minLength={6}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5">Confirm New Password</label>
            <input
              type="password"
              value={pwForm.confirm}
              onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
              className="input"
              required
            />
          </div>
          <Button type="submit" size="sm" loading={saving}>Change Password</Button>
        </form>
      </Card>

      {/* Resign History */}
      <Card>
        <CardHeader title="Resign History" subtitle={`${jobs.length} jobs`} />
        {loadingJobs ? (
          <PageLoader />
        ) : jobs.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-zinc-500 text-center py-6">No resign jobs yet</p>
        ) : (
          <div className="space-y-2">
            {jobs.map((job) => (
              <div key={job.id} className="flex items-center justify-between py-3 border-b border-gray-50 dark:border-zinc-800 last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-zinc-200 truncate">{job.ipaFilename}</p>
                  <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">
                    {format(new Date(job.createdAt), 'MMM d, yyyy HH:mm')}
                    {job.certificate && ` • ${job.certificate.teamName || job.certificate.filename}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-3">
                  <Badge variant={statusToBadge(job.status)}>{job.status}</Badge>
                  {job.status === 'success' && (
                    <button
                      onClick={() => handleDownload(job.id)}
                      className="p-1.5 text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10 rounded-lg transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Sign out */}
      <Button
        variant="danger"
        className="w-full"
        onClick={async () => { await logout(); navigate('/login'); }}
      >
        Sign Out
      </Button>
    </div>
  );
};
