import React, { useState, useEffect } from 'react';
import { certificateApi } from '../../services/api';
import { Card, CardHeader } from '../../components/Common/Card';
import { Button } from '../../components/Common/Button';
import { Modal } from '../../components/Common/Modal';
import { Badge } from '../../components/Common/Badge';
import { PageLoader } from '../../components/Common/LoadingSpinner';
import type { Certificate } from '../../types';
import { formatDistanceToNow } from 'date-fns';

export const CertificatesPage: React.FC = () => {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [p12File, setP12File] = useState<File | null>(null);
  const [provisionFile, setProvisionFile] = useState<File | null>(null);
  const [certMeta, setCertMeta] = useState({
    teamName: '',
    teamId: '',
    bundleId: '',
    isPublic: false,
  });

  useEffect(() => {
    loadCertificates();
  }, []);

  const loadCertificates = async () => {
    try {
      const res = await certificateApi.list();
      setCertificates(res.data.certificates || []);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!p12File) return;
    setUploadError('');
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('p12', p12File);
      if (provisionFile) formData.append('mobileprovision', provisionFile);
      formData.append('teamName', certMeta.teamName);
      formData.append('teamId', certMeta.teamId);
      formData.append('bundleId', certMeta.bundleId);
      formData.append('isPublic', String(certMeta.isPublic));

      await certificateApi.upload(formData);
      await loadCertificates();
      setShowUploadModal(false);
      setP12File(null);
      setProvisionFile(null);
      setCertMeta({ teamName: '', teamId: '', bundleId: '', isPublic: false });
    } catch (err: any) {
      setUploadError(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this certificate?')) return;
    try {
      await certificateApi.delete(id);
      setCertificates((prev) => prev.filter((c) => c.id !== id));
    } catch {}
  };

  const isExpired = (cert: Certificate) => {
    if (!cert.expiryDate) return false;
    return new Date(cert.expiryDate) < new Date();
  };

  if (loading) return <PageLoader message="Loading certificates..." />;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Certificates"
          subtitle={`${certificates.length} certificate${certificates.length !== 1 ? 's' : ''}`}
          action={
            <Button size="sm" onClick={() => setShowUploadModal(true)}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Upload
            </Button>
          }
        />

        {certificates.length === 0 ? (
          <div className="text-center py-10">
            <div className="w-14 h-14 bg-gray-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <p className="text-sm text-gray-500 dark:text-zinc-400">No certificates uploaded yet</p>
            <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1">Upload a .p12 certificate to start resigning</p>
          </div>
        ) : (
          <div className="space-y-3">
            {certificates.map((cert) => (
              <div key={cert.id} className="flex items-start justify-between p-4 bg-gray-50 dark:bg-zinc-800/50 rounded-xl">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isExpired(cert) ? 'bg-red-100 dark:bg-red-500/20' : 'bg-brand-50 dark:bg-brand-500/10'}`}>
                    <svg className={`w-5 h-5 ${isExpired(cert) ? 'text-red-500' : 'text-brand-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-zinc-200">{cert.filename}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      {cert.teamName && <span className="text-xs text-gray-500 dark:text-zinc-400">{cert.teamName}</span>}
                      {cert.teamId && <span className="text-xs text-gray-400 dark:text-zinc-500">({cert.teamId})</span>}
                      {cert.expiryDate && (
                        <Badge variant={isExpired(cert) ? 'error' : 'success'}>
                          {isExpired(cert) ? 'Expired' : `Expires ${formatDistanceToNow(new Date(cert.expiryDate), { addSuffix: true })}`}
                        </Badge>
                      )}
                      {cert.isPublic && <Badge variant="info">Public</Badge>}
                    </div>
                    <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">Used {cert.usageCount} times</p>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(cert.id)}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors ml-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Upload Modal */}
      <Modal isOpen={showUploadModal} onClose={() => setShowUploadModal(false)} title="Upload Certificate">
        <form onSubmit={handleUpload} className="space-y-4">
          {uploadError && (
            <div className="px-4 py-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl">
              <p className="text-sm text-red-600 dark:text-red-400">{uploadError}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5">
              P12 Certificate <span className="text-red-500">*</span>
            </label>
            <input
              type="file"
              accept=".p12"
              onChange={(e) => setP12File(e.target.files?.[0] || null)}
              className="input text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5">
              Mobile Provision (optional)
            </label>
            <input
              type="file"
              accept=".mobileprovision"
              onChange={(e) => setProvisionFile(e.target.files?.[0] || null)}
              className="input text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5">Team Name</label>
              <input
                type="text"
                value={certMeta.teamName}
                onChange={(e) => setCertMeta({ ...certMeta, teamName: e.target.value })}
                className="input"
                placeholder="Apple Developer"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5">Team ID</label>
              <input
                type="text"
                value={certMeta.teamId}
                onChange={(e) => setCertMeta({ ...certMeta, teamId: e.target.value })}
                className="input"
                placeholder="ABCDE12345"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5">Bundle ID</label>
            <input
              type="text"
              value={certMeta.bundleId}
              onChange={(e) => setCertMeta({ ...certMeta, bundleId: e.target.value })}
              className="input"
              placeholder="com.example.app"
            />
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={certMeta.isPublic}
              onChange={(e) => setCertMeta({ ...certMeta, isPublic: e.target.checked })}
              className="w-4 h-4 rounded text-brand-500 focus:ring-brand-500"
            />
            <span className="text-sm text-gray-700 dark:text-zinc-300">Make public (available to all users)</span>
          </label>

          <div className="flex gap-3 pt-2">
            <Button type="submit" className="flex-1" loading={uploading}>Upload Certificate</Button>
            <Button type="button" variant="secondary" onClick={() => setShowUploadModal(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
