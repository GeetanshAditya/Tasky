import { useState } from 'react';
import { X, Github, Lock, Unlock } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { GitHubRepo } from '../types';

interface GitHubRepoModalProps {
  isOpen: boolean;
  onClose: () => void;
  repositories: GitHubRepo[];
  onSelectRepo: (repo: GitHubRepo) => void;
}

export default function GitHubRepoModal({ isOpen, onClose, repositories, onSelectRepo }: GitHubRepoModalProps) {
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null);
  const [filter, setFilter] = useState('');

  if (!isOpen) return null;

  const filteredRepos = repositories.filter(repo =>
    repo.name.toLowerCase().includes(filter.toLowerCase()) ||
    repo.full_name.toLowerCase().includes(filter.toLowerCase())
  );

  const handleSelectRepo = () => {
    if (selectedRepo) {
      onSelectRepo(selectedRepo);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4 border border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Github className="w-5 h-5" />
            Select Repository
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-4">
          <input
            type="text"
            placeholder="Search repositories..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
          />
        </div>

        <div className="max-h-64 overflow-y-auto mb-4">
          {filteredRepos.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              <p>No repositories found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredRepos.map((repo) => (
                <button
                  key={repo.id}
                  onClick={() => setSelectedRepo(repo)}
                  className={`w-full text-left p-3 rounded-lg transition-colors border ${
                    selectedRepo?.id === repo.id
                      ? 'bg-purple-600/20 border-purple-500/50 text-purple-300'
                      : 'bg-gray-700/50 border-gray-600 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {repo.private ? (
                        <Lock className="w-4 h-4 text-yellow-400" />
                      ) : (
                        <Unlock className="w-4 h-4 text-green-400" />
                      )}
                      <span className="font-medium">{repo.name}</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {repo.private ? 'Private' : 'Public'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mt-1">{repo.full_name}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSelectRepo}
            disabled={!selectedRepo}
            className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-white transition-colors"
          >
            Select Repository
          </button>
        </div>
      </div>
    </div>
  );
}