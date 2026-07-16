/**
 * MediaMessageAudio — WhatsApp-style audio player with:
 *  • Play / pause button
 *  • Deterministic fake waveform (stable heights via sin pattern)
 *  • Seekable progress bar
 *  • Current time / duration display
 *  • Playback speed toggle (1× / 1.5× / 2×)
 *  • Voice note badge (when ptt = true)
 */
import { useState, useRef, useEffect, useCallback, useMemo, memo } from 'react';
import { Play, Pause, Mic } from 'lucide-react';
import { formatDuration } from '@/services/storage/interfaces/StorageFile';
import type { Attachment } from '@/types/chat';

// ─── Waveform bars ────────────────────────────────────────────────────────────

const BAR_COUNT = 38;

function useFakeWaveform(): number[] {
  return useMemo(
    () =>
      Array.from({ length: BAR_COUNT }, (_, i) =>
        Math.round(20 + Math.abs(Math.sin(i * 2.9) * 55) + Math.abs(Math.sin(i * 0.4) * 20)),
      ),
    [],
  );
}

function Waveform({
  heights,
  progress,
  fromMe,
}: {
  heights: number[];
  progress: number;
  fromMe: boolean;
}) {
  const playedBars = Math.floor((progress / 100) * heights.length);
  return (
    <div className="flex items-center gap-[2px] h-8 flex-1">
      {heights.map((h, i) => (
        <div
          key={i}
          className={[
            'w-[2.5px] rounded-full transition-colors duration-75',
            i < playedBars
              ? fromMe
                ? 'bg-primary-foreground/90'
                : 'bg-primary'
              : fromMe
              ? 'bg-primary-foreground/30'
              : 'bg-muted-foreground/35',
          ].join(' ')}
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface MediaMessageAudioProps {
  attachment: Attachment;
  fromMe: boolean;
}

const SPEEDS = [1, 1.5, 2] as const;

export const MediaMessageAudio = memo(function MediaMessageAudio({
  attachment,
  fromMe,
}: MediaMessageAudioProps) {
  const [playing, setPlaying]     = useState(false);
  const [progress, setProgress]   = useState(0);        // 0–100
  const [elapsed, setElapsed]     = useState(0);        // seconds
  const [duration, setDuration]   = useState(attachment.durationSecs ?? 0);
  const [speedIdx, setSpeedIdx]   = useState(0);
  const [error, setError]         = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const heights  = useFakeWaveform();
  const src      = attachment.url;

  // ─── Audio element setup ───────────────────────────────────────────────
  useEffect(() => {
    if (!src) return;

    const audio = new Audio(src);
    audioRef.current = audio;

    audio.onloadedmetadata = () => {
      if (isFinite(audio.duration)) setDuration(audio.duration);
    };
    audio.ontimeupdate = () => {
      if (audio.duration > 0) {
        setElapsed(audio.currentTime);
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    };
    audio.onended = () => {
      setPlaying(false);
      setProgress(0);
      setElapsed(0);
      audio.currentTime = 0;
    };
    audio.onerror = () => setError(true);

    return () => {
      audio.pause();
      audio.src = '';
      audioRef.current = null;
    };
  }, [src]);

  // ─── Controls ──────────────────────────────────────────────────────────
  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || error) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play().catch(() => setError(true));
      setPlaying(true);
    }
  }, [playing, error]);

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    const rect  = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    audio.currentTime = ratio * audio.duration;
  }, []);

  const cycleSpeed = useCallback(() => {
    const audio = audioRef.current;
    const next  = (speedIdx + 1) % SPEEDS.length;
    setSpeedIdx(next);
    if (audio) audio.playbackRate = SPEEDS[next];
  }, [speedIdx]);

  const speed = SPEEDS[speedIdx];

  // ─── Render ────────────────────────────────────────────────────────────
  if (!src) {
    return (
      <div className="flex items-center gap-3 px-3 py-2.5 bg-black/10 rounded-xl min-w-[200px]">
        <Mic className="w-4 h-4 opacity-40" />
        <span className="text-xs text-muted-foreground">Áudio indisponível</span>
      </div>
    );
  }

  const timeDisplay = playing || elapsed > 0
    ? formatDuration(elapsed)
    : formatDuration(duration);

  return (
    <div className={[
      'flex items-center gap-2.5 rounded-2xl px-3 py-2 min-w-[220px] max-w-[300px]',
      fromMe ? 'bg-primary/20' : 'bg-muted/60',
    ].join(' ')}>
      {/* Play / Pause */}
      <button
        onClick={togglePlay}
        disabled={error}
        className={[
          'shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-colors',
          fromMe
            ? 'bg-primary/30 hover:bg-primary/50 text-primary-foreground'
            : 'bg-primary/15 hover:bg-primary/25 text-primary',
          error ? 'opacity-40 cursor-not-allowed' : '',
        ].join(' ')}
        title={playing ? 'Pausar' : 'Reproduzir'}
      >
        {playing
          ? <Pause className="w-4 h-4 fill-current" />
          : <Play  className="w-4 h-4 fill-current ml-0.5" />
        }
      </button>

      {/* Waveform + seek */}
      <div className="flex flex-col gap-1 flex-1 min-w-0">
        {/* Waveform — clickable for seek */}
        <div
          className="cursor-pointer select-none"
          onClick={handleSeek}
          title="Clique para buscar"
        >
          <Waveform heights={heights} progress={progress} fromMe={fromMe} />
        </div>

        {/* Time + speed */}
        <div className="flex items-center justify-between">
          <span className={`text-[10px] tabular-nums ${
            fromMe ? 'text-primary-foreground/60' : 'text-muted-foreground'
          }`}>
            {timeDisplay}
          </span>

          {/* Speed toggle */}
          <button
            onClick={cycleSpeed}
            className={[
              'text-[10px] font-semibold px-1.5 py-0.5 rounded transition-colors',
              fromMe
                ? 'text-primary-foreground/70 hover:bg-white/10'
                : 'text-muted-foreground hover:bg-muted',
            ].join(' ')}
            title="Velocidade de reprodução"
          >
            {speed}×
          </button>
        </div>
      </div>

      {/* Voice note icon */}
      {attachment.ptt && (
        <Mic className={`shrink-0 w-3.5 h-3.5 ${
          fromMe ? 'text-primary-foreground/50' : 'text-primary/50'
        }`} />
      )}
    </div>
  );
});
