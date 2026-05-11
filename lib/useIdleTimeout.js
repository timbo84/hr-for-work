'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { signOut } from 'next-auth/react';

const IDLE_MINUTES = parseInt(process.env.NEXT_PUBLIC_IDLE_TIMEOUT_MINUTES || '15', 10);
const IDLE_MS = IDLE_MINUTES * 60 * 1000;

// Events that count as user activity
const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

export function useIdleTimeout() {
  const timerRef = useRef(null);
  const deadlineRef = useRef(null);
  const [secondsLeft, setSecondsLeft] = useState(IDLE_MINUTES * 60);

  const logout = useCallback(async () => {
    // Sign out server-side first, then hard-navigate so the dashboard
    // is guaranteed to fully remount on next login (busts router cache).
    await signOut({ redirect: false });
    window.location.href = '/?reason=idle';
  }, []);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    deadlineRef.current = Date.now() + IDLE_MS;
    timerRef.current = setTimeout(logout, IDLE_MS);
  }, [logout]);

  useEffect(() => {
    // Start the timer
    resetTimer();

    // Reset on any user activity
    ACTIVITY_EVENTS.forEach(event => window.addEventListener(event, resetTimer, { passive: true }));

    // Countdown ticker — updates display every second
    const ticker = setInterval(() => {
      if (deadlineRef.current) {
        const remaining = Math.max(0, Math.ceil((deadlineRef.current - Date.now()) / 1000));
        setSecondsLeft(remaining);
      }
    }, 1000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      clearInterval(ticker);
      ACTIVITY_EVENTS.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [resetTimer]);

  return { secondsLeft };
}
