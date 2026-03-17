import React, { useState, useEffect } from 'react';
import { repositoryApi } from '../../services/api';
import { Card, CardHeader } from '../../components/Common/Card';
import { Button } from '../../components/Common/Button';
import { Badge } from '../../components/Common/Badge';
import { Modal } from '../../components/Common/Modal';
import { PageLoader } from '../../components/Common/LoadingSpinner';
import type { Repository } from '../../types';
import { format } from 'date-fns';

export const AdminRepositories: React.FC = () => {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRepo, setNewRepo] = useState({ url: '', name: '', description: '' });
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    loadRepos();
  }, []);

  const loadRepos = async () => {
    setLoading(true);
    try {
      const res = await repositoryApi.list();
      setRepositories(res.data.repositories || []);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    try {
      await repositoryApi.add(newRepo);
      await loadRepos();
      setShowAddModal(false);
      setNewRepo({ url: '', name: '', description: '' });
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this repository?')) return;
    try {
      await repositoryApi.delete(id);
      await loadRepos();
    } catch {}
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Repositories"
          subtitle={`${repositories.length} repositories`}
          action={
            <Button size="sm" onClick={() => setShowAddModal(true)}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add
            </Button>
          }
        />

        {loading ? (
          <PageLoader />
        ) : repositories.length === 0 ? (
          <p className="text-center text-sm text-gray-400 dark:text-zinc-500 py-8">No repositories</p>
        ) : (
          <div className="space-y-3">
            {repositories.map((repo) => (
              <div key={repo.id} className="flex items-start justify-between p-4 bg-gray-50 dark:bg-zinc-800/50 rounded-xl">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-800 dark:text-zinc-200">{repo.name}</p>
                    {repo.isDefault && <Badge variant="info">Default</Badge>}
                  </div>
                  {repo.description && (
                    <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">{repo.description}</p>
                  )}
                  <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1 break-all">{repo.url}</p>
                  <div className="flex gap-3 mt-1.5 text-xs text-gray-400 dark:text-zinc-500">
                    <span>{repo.appCount} apps</span>
                    {repo.lastSynced && (
                      <span>Synced {format(new Date(repo.lastSynced), 'MMM d')}</span>
                    )}
                  </div>
                </div>
                {!repo.isDefault && (
                  <button
                    onClick={() => handleDelete(repo.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors ml-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Repository">
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5">URL</label>
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
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5">Description</label>
            <input
              type="text"
              value={newRepo.description}
              onChange={(e) => setNewRepo({ ...newRepo, description: e.target.value })}
              className="input"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" className="flex-1" loading={adding}>Add Repository</Button>
            <Button type="button" variant="secondary" onClick={() => setShowAddModal(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
