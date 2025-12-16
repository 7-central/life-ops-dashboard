'use client';

import { useState, useEffect, useRef } from 'react';

interface FocusTimerProps {
  durationMinutes: number;
  isPaused: boolean;
  onComplete: (elapsedMinutes: number) => void;
  onMinuteElapsed: (minutes: number) => void;
}

export function FocusTimer({
  durationMinutes,
  isPaused,
  onComplete,
  onMinuteElapsed,
}: FocusTimerProps) {
  const [secondsRemaining, setSecondsRemaining] = useState(durationMinutes * 60);
  const [notified5min, setNotified5min] = useState(false);
  const [notified1min, setNotified1min] = useState(false);
  const lastReportedMinutes = useRef<number>(0);

  useEffect(() => {
    if (isPaused || secondsRemaining <= 0) return;

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        const newValue = prev - 1;

        // Check for completion
        if (newValue <= 0) {
          onComplete(durationMinutes);
          playNotificationSound();
          return 0;
        }

        // Notifications
        if (newValue === 300 && !notified5min) {
          setNotified5min(true);
          showNotification('5 minutes remaining!');
        }

        if (newValue === 60 && !notified1min) {
          setNotified1min(true);
          showNotification('1 minute remaining!');
          playNotificationSound();
        }

        return newValue;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [
    isPaused,
    secondsRemaining,
    durationMinutes,
    onComplete,
    notified5min,
    notified1min,
  ]);

  // Update elapsed minutes only when they change (not every second)
  useEffect(() => {
    const elapsedMinutes = Math.ceil((durationMinutes * 60 - secondsRemaining) / 60);

    // Only call parent callback when the minute value changes
    if (elapsedMinutes !== lastReportedMinutes.current) {
      lastReportedMinutes.current = elapsedMinutes;
      onMinuteElapsed(elapsedMinutes);
    }
  }, [secondsRemaining, durationMinutes, onMinuteElapsed]);

  function showNotification(message: string) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Focus Timer', { body: message });
    } else if ('Notification' in window && Notification.permission !== 'denied') {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          new Notification('Focus Timer', { body: message });
        }
      });
    }
  }

  function playNotificationSound() {
    // Simple beep using Web Audio API
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.log('Audio notification not available');
    }
  }

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const totalSeconds = durationMinutes * 60;
  const progress = ((totalSeconds - secondsRemaining) / totalSeconds) * 100;

  const isWarning = secondsRemaining <= 300; // Last 5 minutes
  const isCritical = secondsRemaining <= 60; // Last minute

  return (
    <div className="flex flex-col items-center">
      {/* Circular Progress */}
      <div className="relative w-64 h-64 mb-8">
        <svg className="w-full h-full transform -rotate-90">
          {/* Background circle */}
          <circle
            cx="128"
            cy="128"
            r="120"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-gray-700"
          />
          {/* Progress circle */}
          <circle
            cx="128"
            cy="128"
            r="120"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            strokeDasharray={`${2 * Math.PI * 120}`}
            strokeDashoffset={`${2 * Math.PI * 120 * (1 - progress / 100)}`}
            className={`transition-all duration-1000 ${
              isCritical
                ? 'text-red-500'
                : isWarning
                  ? 'text-yellow-500'
                  : 'text-green-500'
            }`}
            strokeLinecap="round"
          />
        </svg>

        {/* Time display */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div
              className={`text-6xl font-bold tabular-nums ${
                isCritical
                  ? 'text-red-400 animate-pulse'
                  : isWarning
                    ? 'text-yellow-400'
                    : 'text-white'
              }`}
            >
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </div>
            {isPaused && (
              <div className="text-sm text-yellow-400 mt-2 font-medium">PAUSED</div>
            )}
          </div>
        </div>
      </div>

      {/* Progress percentage */}
      <div className="text-sm text-gray-400">
        {Math.round(progress)}% complete
      </div>

      {/* Warnings */}
      {isWarning && !isPaused && (
        <div className="mt-4 text-center">
          {isCritical ? (
            <div className="text-red-400 font-medium animate-pulse">
              Less than 1 minute remaining!
            </div>
          ) : (
            <div className="text-yellow-400 font-medium">
              {minutes} {minutes === 1 ? 'minute' : 'minutes'} remaining
            </div>
          )}
        </div>
      )}
    </div>
  );
}
