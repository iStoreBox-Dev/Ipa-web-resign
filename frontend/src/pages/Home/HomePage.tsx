import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { FileDropzone } from '../../components/Common/FileDropzone';
import { Button } from '../../components/Common/Button';
import { Card, CardHeader } from '../../components/Common/Card';
import { Badge, statusToBadge } from '../../components/Common/Badge';
import { resignApi, certificateApi } from '../../services/api';
import type { Certificate, ResignJob } from '../../types';
import { formatDistanceToNow } from 'date-fns';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [ipaFile, setIpaFile] = useState<File | null>(null);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [selectedCertId, setSelectedCertId] = useState('');
  const [recentJobs, setRecentJobs] = useState<ResignJob[]>([]);
  const [currentJob, setCurrentJob] = useState<ResignJob | null>(null);
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Load certificates and recent jobs
    const loadData = async () => {
      try {
        const [certRes, jobRes] = await Promise.all([
          certificateApi.list(),
          resignApi.list({ limit: 5 }),
        ]);
        setCertificates(certRes.data.certificates || []);
        setRecentJobs(jobRes.data.jobs || []);
      } catch {}
    };
    loadData();

    // Setup socket
    const s = io({ path: '/socket.io' });
    setSocket(s);
    return () => {
      s.disconnect();
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
    };
  }, []);

  const handleFileDrop = (files: File[]) => {
    if (files[0]) setIpaFile(files[0]);
  };

  const handleSubmit = async () => {
    if (!ipaFile) return;
    setError('');
    setLoading(true);
    setProgress(0);
    setProgressMsg('Uploading IPA...');

    try {
      const formData = new FormData();
      formData.append('ipa', ipaFile);
      if (selectedCertId) formData.append('certificateId', selectedCertId);

      const res = await resignApi.submit(formData);
      const job = res.data.job as ResignJob;
      setCurrentJob(job);
      setProgressMsg('Job queued...');

      // Listen for progress
      if (socket) {
        socket.on(`resign:progress:${job.id}`, ({ progress: p, message }: { progress: number; message: string }) => {
          setProgress(p);
          setProgressMsg(message);
        });

        socket.on(`resign:complete:${job.id}`, ({ job: completedJob }: { job: ResignJob }) => {
          setCurrentJob(completedJob);
          setRecentJobs((prev) => [completedJob, ...prev.slice(0, 4)]);
          setLoading(false);
          if (completedJob.status === 'failed') {
            setError(completedJob.errorMessage || 'Resigning failed');
          }
        });
      }

      // Poll as fallback
      pollIntervalRef.current = setInterval(async () => {
        try {
          const updated = await resignApi.get(job.id);
          const updatedJob = updated.data.job as ResignJob;
          if (updatedJob.status === 'success' || updatedJob.status === 'failed') {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
            setCurrentJob(updatedJob);
            setLoading(false);
            setProgress(100);
          }
        } catch {}
      }, 2000);

      pollTimeoutRef.current = setTimeout(() => {
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      }, 60000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit job');
      setLoading(false);
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

  const resetForm = () => {
    setIpaFile(null);
    setCurrentJob(null);
    setProgress(0);
    setProgressMsg('');
    setError('');
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card>
        <CardHeader title="Resign IPA" subtitle="Upload an IPA file to sign with your certificate" />

        {!currentJob ? (
          <div className="space-y-4">
            <FileDropzone
              onDrop={handleFileDrop}
              accept={{ 'application/octet-stream': ['.ipa'] }}
              maxSize={524288000}
              disabled={loading}
            >
              {ipaFile ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-14 h-14 bg-green-50 dark:bg-green-500/10 rounded-2xl flex items-center justify-center">
                    <svg className="w-7 h-7 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-700 dark:text-zinc-300">{ipaFile.name}</p>
                    <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">
                      {(ipaFile.size / 1024 / 1024).toFixed(1)} MB • Click to change
                    </p>
                  </div>
                </div>
              ) : undefined}
            </FileDropzone>

            {certificates.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5">
                  Certificate (optional)
                </label>
                <select
                  value={selectedCertId}
                  onChange={(e) => setSelectedCertId(e.target.value)}
                  className="input"
                >
                  <option value="">No certificate selected</option>
                  {certificates.map((cert) => (
                    <option key={cert.id} value={cert.id}>
                      {cert.filename} {cert.teamName ? `— ${cert.teamName}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {certificates.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-zinc-400 text-center">
                No certificates uploaded yet.{' '}
                <button onClick={() => navigate('/certificates')} className="text-brand-500 hover:text-brand-600">
                  Add one
                </button>
              </p>
            )}

            {error && (
              <div className="px-4 py-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            <Button
              onClick={handleSubmit}
              className="w-full"
              disabled={!ipaFile}
              loading={loading}
            >
              {loading ? progressMsg || 'Processing...' : 'Resign IPA'}
            </Button>

            {loading && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-gray-500 dark:text-zinc-400">
                  <span>{progressMsg}</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-500 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-4 space-y-4">
            {currentJob.status === 'success' ? (
              <>
                <div className="w-16 h-16 bg-green-50 dark:bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Resigning Complete!</h3>
                  <p className="text-sm text-gray-500 dark:text-zinc-400 mt-0.5">Your IPA has been signed successfully</p>
                </div>
                <div className="flex gap-3 justify-center">
                  <Button onClick={() => handleDownload(currentJob.id)}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download IPA
                  </Button>
                  <Button variant="secondary" onClick={resetForm}>Sign Another</Button>
                </div>
              </>
            ) : currentJob.status === 'failed' ? (
              <>
                <div className="w-16 h-16 bg-red-50 dark:bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Resigning Failed</h3>
                  <p className="text-sm text-red-500 mt-0.5">{currentJob.errorMessage}</p>
                </div>
                <Button variant="secondary" onClick={resetForm}>Try Again</Button>
              </>
            ) : (
              <>
                <div className="flex items-center justify-center">
                  <svg className="animate-spin h-12 w-12 text-brand-500" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                </div>
                <p className="text-sm text-gray-500 dark:text-zinc-400">{progressMsg || 'Processing...'}</p>
                <div className="h-2 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden max-w-xs mx-auto">
                  <div className="h-full bg-brand-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                </div>
              </>
            )}
          </div>
        )}
      </Card>

      {/* Recent Jobs */}
      {recentJobs.length > 0 && (
        <Card>
          <CardHeader title="Recent Jobs" />
          <div className="space-y-2">
            {recentJobs.map((job) => (
              <div key={job.id} className="flex items-center justify-between py-2.5 border-b border-gray-50 dark:border-zinc-800 last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-zinc-200 truncate">{job.ipaFilename}</p>
                  <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">
                    {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
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
        </Card>
      )}
    </div>
  );
};
