import React, { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';
import { Card, CardHeader } from '../../components/Common/Card';
import { Badge } from '../../components/Common/Badge';
import { PageLoader } from '../../components/Common/LoadingSpinner';
import { format } from 'date-fns';

export const AdminCertificates: React.FC = () => {
  const [certificates, setCertificates] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await adminApi.listCertificates({ page, limit: 20 });
        setCertificates(res.data.certificates || []);
        setTotal(res.data.total || 0);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [page]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title="All Certificates" subtitle={`${total} total`} />

        {loading ? (
          <PageLoader />
        ) : certificates.length === 0 ? (
          <p className="text-center text-sm text-gray-400 dark:text-zinc-500 py-8">No certificates found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 dark:text-zinc-500 border-b border-gray-100 dark:border-zinc-800">
                  <th className="pb-3 font-medium">Certificate</th>
                  <th className="pb-3 font-medium">Owner</th>
                  <th className="pb-3 font-medium">Team</th>
                  <th className="pb-3 font-medium">Visibility</th>
                  <th className="pb-3 font-medium hidden md:table-cell">Uploaded</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-zinc-800">
                {certificates.map((cert: any) => (
                  <tr key={cert.id}>
                    <td className="py-3 text-gray-800 dark:text-zinc-200">{cert.filename}</td>
                    <td className="py-3 text-gray-500 dark:text-zinc-400">{cert.user?.username || '-'}</td>
                    <td className="py-3 text-gray-500 dark:text-zinc-400">{cert.teamName || '-'}</td>
                    <td className="py-3">
                      <Badge variant={cert.isPublic ? 'info' : 'default'}>
                        {cert.isPublic ? 'Public' : 'Private'}
                      </Badge>
                    </td>
                    <td className="py-3 text-gray-400 dark:text-zinc-500 hidden md:table-cell">
                      {format(new Date(cert.createdAt), 'MMM d, yyyy')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {total > 20 && (
          <div className="flex justify-center gap-2 mt-4">
            <button
              onClick={() => setPage(p => p - 1)}
              disabled={page === 1}
              className="btn-secondary text-sm px-3 py-1.5 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-500 dark:text-zinc-400 px-3 py-1.5">
              Page {page} of {Math.ceil(total / 20)}
            </span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page >= Math.ceil(total / 20)}
              className="btn-secondary text-sm px-3 py-1.5 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </Card>
    </div>
  );
};
