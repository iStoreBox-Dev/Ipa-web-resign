import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../services/api';
import { Card, CardHeader } from '../../components/Common/Card';
import { Badge, statusToBadge } from '../../components/Common/Badge';
import { PageLoader } from '../../components/Common/LoadingSpinner';
import type { AdminStats, ResignJob } from '../../types';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

const COLORS = ['#0f8fe9', '#22c55e', '#ef4444', '#f59e0b'];

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentJobs, setRecentJobs] = useState<ResignJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const res = await adminApi.getStats();
        setStats(res.data.stats);
        setRecentJobs(res.data.recentJobs || []);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  if (loading) return <PageLoader message="Loading dashboard..." />;
  if (!stats) return null;

  const statusData = [
    { name: 'Success', value: stats.successCount, color: '#22c55e' },
    { name: 'Failed', value: stats.failedCount, color: '#ef4444' },
    { name: 'Other', value: stats.totalResignings - stats.successCount - stats.failedCount, color: '#f59e0b' },
  ].filter((d) => d.value > 0);

  const statCards = [
    {
      label: 'Total Users',
      value: stats.totalUsers,
      icon: '👥',
      color: 'text-blue-500',
      bg: 'bg-blue-50 dark:bg-blue-500/10',
    },
    {
      label: 'Total Resignings',
      value: stats.totalResignings,
      icon: '🔏',
      color: 'text-green-500',
      bg: 'bg-green-50 dark:bg-green-500/10',
    },
    {
      label: 'Certificates',
      value: stats.totalCertificates,
      icon: '🔐',
      color: 'text-purple-500',
      bg: 'bg-purple-50 dark:bg-purple-500/10',
    },
    {
      label: 'Total Storage',
      value: formatBytes(stats.totalStorage),
      icon: '💾',
      color: 'text-orange-500',
      bg: 'bg-orange-50 dark:bg-orange-500/10',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <Card key={card.label}>
            <div className={`w-10 h-10 ${card.bg} rounded-xl flex items-center justify-center text-xl mb-3`}>
              {card.icon}
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{card.value}</p>
            <p className="text-sm text-gray-500 dark:text-zinc-400 mt-0.5">{card.label}</p>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {statusData.length > 0 && (
          <Card>
            <CardHeader title="Job Status" />
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [value, 'Jobs']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        )}

        <Card>
          <CardHeader title="Overview" />
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={[
              { name: 'Users', value: stats.totalUsers },
              { name: 'Resignings', value: stats.totalResignings },
              { name: 'Certificates', value: stats.totalCertificates },
              { name: 'Success', value: stats.successCount },
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="value" fill="#0f8fe9" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Manage Users', to: '/admin/users', icon: '👥' },
          { label: 'Certificates', to: '/admin/certificates', icon: '🔐' },
          { label: 'Repositories', to: '/admin/repositories', icon: '📦' },
        ].map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className="card p-5 flex items-center gap-3 hover:shadow-md transition-all group"
          >
            <span className="text-2xl">{link.icon}</span>
            <span className="text-sm font-medium text-gray-700 dark:text-zinc-300 group-hover:text-brand-500 transition-colors">
              {link.label}
            </span>
            <svg className="w-4 h-4 text-gray-400 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        ))}
      </div>

      {/* Recent Jobs */}
      {recentJobs.length > 0 && (
        <Card>
          <CardHeader title="Recent Jobs" />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 dark:text-zinc-500 border-b border-gray-100 dark:border-zinc-800">
                  <th className="pb-3 font-medium">File</th>
                  <th className="pb-3 font-medium">User</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-zinc-800">
                {recentJobs.map((job: any) => (
                  <tr key={job.id}>
                    <td className="py-3 text-gray-800 dark:text-zinc-200 truncate max-w-[180px]">{job.ipaFilename}</td>
                    <td className="py-3 text-gray-500 dark:text-zinc-400">{job.user?.username || '-'}</td>
                    <td className="py-3">
                      <Badge variant={statusToBadge(job.status)}>{job.status}</Badge>
                    </td>
                    <td className="py-3 text-gray-400 dark:text-zinc-500 text-xs">
                      {new Date(job.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};
