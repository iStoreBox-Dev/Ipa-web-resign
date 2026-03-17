import React, { useState, useEffect } from 'react';
import { repositoryApi } from '../../services/api';
import { Card, CardHeader } from '../../components/Common/Card';
import { Button } from '../../components/Common/Button';
import { Modal } from '../../components/Common/Modal';
import { PageLoader } from '../../components/Common/LoadingSpinner';
import type { Repository, RepositoryApp } from '../../types';

export const LibraryPage: React.FC = () => {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);
  const [apps, setApps] = useState<RepositoryApp[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(true);
  const [loadingApps, setLoadingApps] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRepo, setNewRepo] = useState({ url: '', name: '', description: '' });
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadRepositories();
  }, []);

  useEffect(() => {
    if (selectedRepo) loadApps(selectedRepo.id);
  }, [selectedRepo]);

  const loadRepositories = async () => {
    try {
      const res = await repositoryApi.list();
      const repos = res.data.repositories || [];
      setRepositories(repos);
      if (repos.length > 0) setSelectedRepo(repos[0]);
    } finally {
      setLoadingRepos(false);
    }
  };

  const loadApps = async (repoId: string) => {
    setLoadingApps(true);
    setApps([]);
    try {
      const res = await repositoryApi.getApps(repoId);
      setApps(res.data.apps || []);
    } finally {
      setLoadingApps(false);
    }
  };

  const handleAddRepo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await repositoryApi.add(newRepo);
      await loadRepositories();
      setShowAddModal(false);
      setNewRepo({ url: '', name: '', description: '' });
    } catch {}
  };

  const filteredApps = apps.filter((app) => {
    const q = searchQuery.toLowerCase();
    return (
      !q ||
      app.name?.toLowerCase().includes(q) ||
      app.bundleIdentifier?.toLowerCase().includes(q) ||
      app.developer?.toLowerCase().includes(q)
    );
  });

  if (loadingRepos) return <PageLoader message="Loading repositories..." />;

  return (
    <div className="space-y-6">
      {/* Repository selector */}
      <Card>
        <CardHeader
          title="App Library"
          subtitle="Browse apps from repositories"
          action={
            <Button size="sm" variant="secondary" onClick={() => setShowAddModal(true)}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Repo
            </Button>
          }
        />

        <div className="flex gap-2 overflow-x-auto pb-1">
          {repositories.map((repo) => (
            <button
              key={repo.id}
              onClick={() => setSelectedRepo(repo)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                selectedRepo?.id === repo.id
                  ? 'bg-brand-500 text-white'
                  : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-700'
              }`}
            >
              {repo.name}
            </button>
          ))}
        </div>
      </Card>

      {/* Search */}
      <div className="relative">
        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Search apps..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input pl-10"
        />
      </div>

      {/* Apps grid */}
      {loadingApps ? (
        <PageLoader message="Loading apps..." />
      ) : filteredApps.length === 0 ? (
        <div className="text-center py-12 text-gray-400 dark:text-zinc-500">
          <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <p className="text-sm">{searchQuery ? 'No matching apps' : 'No apps in this repository'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredApps.map((app, i) => (
            <AppCard key={i} app={app} />
          ))}
        </div>
      )}

      {/* Add Repository Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Repository">
        <form onSubmit={handleAddRepo} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5">Repository URL</label>
            <input
              type="url"
              value={newRepo.url}
              onChange={(e) => setNewRepo({ ...newRepo, url: e.target.value })}
              className="input"
              placeholder="https://example.com/repo.json"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5">Name</label>
            <input
              type="text"
              value={newRepo.name}
              onChange={(e) => setNewRepo({ ...newRepo, name: e.target.value })}
              className="input"
              placeholder="My Repository"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5">Description (optional)</label>
            <input
              type="text"
              value={newRepo.description}
              onChange={(e) => setNewRepo({ ...newRepo, description: e.target.value })}
              className="input"
              placeholder="A collection of apps..."
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" className="flex-1">Add Repository</Button>
            <Button type="button" variant="secondary" onClick={() => setShowAddModal(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

const AppCard: React.FC<{ app: RepositoryApp }> = ({ app }) => {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 p-4 hover:shadow-md transition-all">
      <div className="flex items-start gap-3">
        {app.iconURL ? (
          <img
            src={app.iconURL}
            alt={app.name}
            className="w-14 h-14 rounded-2xl object-cover flex-shrink-0 border border-gray-100 dark:border-zinc-800"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="w-14 h-14 bg-gradient-to-br from-brand-400 to-brand-600 rounded-2xl flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xl font-bold">{(app.name || '?')[0]}</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">{app.name || 'Unknown'}</h3>
          {app.developer && <p className="text-xs text-gray-500 dark:text-zinc-400 truncate">{app.developer}</p>}
          {app.version && <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">v{app.version}</p>}
        </div>
      </div>
      {app.localizedDescription && (
        <p className="text-xs text-gray-500 dark:text-zinc-400 mt-3 line-clamp-2">{app.localizedDescription}</p>
      )}
      {app.downloadURL && (
        <a
          href={app.downloadURL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 block text-center py-2 bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 text-xs font-medium rounded-xl hover:bg-brand-100 dark:hover:bg-brand-500/20 transition-colors"
        >
          Download IPA
        </a>
      )}
    </div>
  );
};
