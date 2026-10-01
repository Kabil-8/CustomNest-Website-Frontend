import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Check } from 'lucide-react';
import { usePushNotifications } from '../../hooks/usePushNotifications';

interface NotificationBellProps {
  className?: string;
}

export function NotificationBell({ className = '' }: NotificationBellProps) {
  const { isSupported, isSubscribed, subscribe, unsubscribe, sendTestNotification, error } = usePushNotifications();
  const [showTooltip, setShowTooltip] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);

  // Auto-subscribe when admin logs in (if supported)
  useEffect(() => {
    if (isSupported && !isSubscribed) {
      // Optional: Auto-subscribe on admin page load
      // subscribe();
    }
  }, [isSupported, isSubscribed]);

  const handleToggleSubscription = async () => {
    if (isSubscribed) {
      await unsubscribe();
    } else {
      await subscribe();
    }
  };

  const handleTestNotification = async () => {
    if (!isSubscribed) return;
    
    setTesting(true);
    setTestResult(null);
    
    const success = await sendTestNotification();
    setTestResult(success ? 'success' : 'error');
    setTesting(false);
    
    // Reset result after 3 seconds
    setTimeout(() => setTestResult(null), 3000);
  };

  if (!isSupported) {
    return null;
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setShowTooltip(!showTooltip)}
        onBlur={() => setTimeout(() => setShowTooltip(false), 200)}
        className={`relative p-2 rounded-xl transition-all duration-200 ${
          isSubscribed 
            ? 'bg-rose-100 text-rose-600 hover:bg-rose-200' 
            : 'bg-sand text-muted hover:bg-sand/80'
        }`}
        aria-label={isSubscribed ? 'Notifications enabled' : 'Notifications disabled'}
      >
        {isSubscribed ? (
          <Bell size={20} className="animate-pulse-once" />
        ) : (
          <BellOff size={20} />
        )}
        
        {/* Badge indicator */}
        {isSubscribed && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
        )}
      </button>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-xl border border-line overflow-hidden z-50">
          <div className="p-4 border-b border-line bg-cream/50">
            <h3 className="font-bold text-sm text-charcoal">Push Notifications</h3>
            <p className="text-xs text-muted mt-0.5">
              {isSubscribed 
                ? 'You will receive real-time alerts for new orders, custom orders, reviews & inquiries.' 
                : 'Enable to get instant alerts for new orders and inquiries.'}
            </p>
          </div>

          <div className="p-3 space-y-2">
            {/* Subscription status */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted">Status</span>
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                isSubscribed 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-sand text-muted'
              }`}>
                {isSubscribed ? (
                  <><Check size={12} className="inline mr-1" /> Enabled</>
                ) : (
                  'Disabled'
                )}
              </span>
            </div>

            {/* Toggle button */}
            <button
              onClick={handleToggleSubscription}
              className={`w-full py-2.5 px-4 rounded-xl text-sm font-semibold transition-all ${
                isSubscribed
                  ? 'bg-sand text-charcoal hover:bg-sand/80'
                  : 'bg-rose-500 text-white hover:bg-rose-600'
              }`}
            >
              {isSubscribed ? 'Disable Notifications' : 'Enable Notifications'}
            </button>

            {/* Test button (only when subscribed) */}
            {isSubscribed && (
              <button
                onClick={handleTestNotification}
                disabled={testing}
                className="w-full py-2 px-4 rounded-xl text-sm font-medium bg-white border border-line text-charcoal hover:bg-sand/50 transition-all disabled:opacity-50"
              >
                {testing ? 'Sending...' : testResult === 'success' ? '✓ Test Sent!' : testResult === 'error' ? '✗ Failed' : 'Send Test Notification'}
              </button>
            )}

            {/* Error message */}
            {error && (
              <p className="text-xs text-red-500 bg-red-50 p-2 rounded-lg">
                {error}
              </p>
            )}
          </div>

          <div className="px-4 py-3 bg-sand/30 text-[0.65rem] text-muted">
            Notifications work when the browser is open or installed as PWA.
          </div>
        </div>
      )}
    </div>
  );
}