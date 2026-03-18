import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader } from '../../components/Common/Card';
import { Button } from '../../components/Common/Button';
import { useAuth } from '../../hooks/useAuth';
import { userApi } from '../../services/api';

export const PlansPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const isSubscribed = !!user?.isSubscribed;

  const handleUpgrade = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setLoading(true);
    setMessage('');
    try {
      const res = await userApi.startBillingCheckout({ plan: 'pro' });
      setMessage(res.data?.message || 'Billing placeholder started.');
    } catch (err: any) {
      setMessage(err.response?.data?.error || 'Failed to start billing placeholder.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Plans & Upgrade"
          subtitle="Free plan for public resigning, Pro plan for premium resign controls"
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-gray-100 dark:border-zinc-800 p-5 bg-white dark:bg-zinc-900/50">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Free</h3>
            <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">Public access</p>
            <ul className="mt-4 space-y-2 text-sm text-gray-700 dark:text-zinc-300">
              <li>Browse IPA library</li>
              <li>Download IPA files</li>
              <li>Resign using public free certificates</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-brand-200 dark:border-brand-500/40 p-5 bg-brand-50/40 dark:bg-brand-500/10">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Pro</h3>
              <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-brand-500 text-white">Upgrade</span>
            </div>
            <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">Paid subscription</p>
            <ul className="mt-4 space-y-2 text-sm text-gray-700 dark:text-zinc-300">
              <li>Change app name, bundle id, and version</li>
              <li>Inject tweaks during resign process</li>
              <li>Use private/custom certificates (where allowed)</li>
            </ul>

            <div className="mt-5">
              {isSubscribed ? (
                <Button variant="secondary" disabled className="w-full">Current Plan: Pro</Button>
              ) : (
                <Button onClick={handleUpgrade} loading={loading} className="w-full">
                  {isAuthenticated ? 'Start Upgrade (Placeholder)' : 'Login To Upgrade'}
                </Button>
              )}
            </div>
          </div>
        </div>

        {message && (
          <div className="mt-4 px-4 py-3 rounded-xl border border-blue-200 dark:border-blue-500/30 bg-blue-50 dark:bg-blue-500/10">
            <p className="text-sm text-blue-700 dark:text-blue-300">{message}</p>
          </div>
        )}
      </Card>
    </div>
  );
};
