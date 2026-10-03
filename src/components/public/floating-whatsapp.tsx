'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/context';

const MESSAGE =
  "Hello Lura, I'd like to enquire about your solar products and services.";

const FIRST_DELAY_MS = 30_000;
const VISIBLE_MS = 10_000;
const HIDDEN_MS = 30_000;

function cleanNumber(raw: string): string {
  return raw.replace(/[^0-9]/g, '');
}

function buildBeepDataUrl(): string {
  const sampleRate = 22050;
  const totalDuration = 0.42;
  const numSamples = Math.floor(sampleRate * totalDuration);
  const bytesPerSample = 2;
  const dataSize = numSamples * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);
  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };
  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * bytesPerSample, true);
  view.setUint16(32, bytesPerSample, true);
  view.setUint16(34, 16, true);
  writeStr(36, 'data');
  view.setUint32(40, dataSize, true);
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let freq = 0;
    let localT = 0;
    let localDur = 0;
    if (t < 0.20) {
      freq = 880;
      localT = t;
      localDur = 0.20;
    } else if (t >= 0.22) {
      freq = 1175;
      localT = t - 0.22;
      localDur = 0.20;
    } else {
      view.setInt16(44 + i * bytesPerSample, 0, true);
      continue;
    }
    const attack = Math.min(1, localT * 60);
    const release = Math.max(0, 1 - localT / localDur);
    const env = attack * release * release;
    const sample = Math.sin(2 * Math.PI * freq * localT) * env * 0.55;
    view.setInt16(44 + i * bytesPerSample, Math.max(-1, Math.min(1, sample)) * 32767, true);
  }
  let binary = '';
  const uint8 = new Uint8Array(buffer);
  const chunk = 8192;
  for (let i = 0; i < uint8.length; i += chunk) {
    binary += String.fromCharCode.apply(
      null,
      Array.from(uint8.subarray(i, Math.min(i + chunk, uint8.length))),
    );
  }
  return 'data:audio/wav;base64,' + btoa(binary);
}

let cachedBeepUrl: string | null = null;
function getBeepUrl(): string {
  if (!cachedBeepUrl) cachedBeepUrl = buildBeepDataUrl();
  return cachedBeepUrl;
}

let sharedAudio: HTMLAudioElement | null = null;
function getAudio(): HTMLAudioElement | null {
  if (typeof window === 'undefined') return null;
  if (sharedAudio) return sharedAudio;
  try {
    sharedAudio = new Audio(getBeepUrl());
    sharedAudio.volume = 0.75;
    sharedAudio.preload = 'auto';
    return sharedAudio;
  } catch {
    return null;
  }
}

function warmupAudio() {
  const audio = getAudio();
  if (!audio) return;
  try {
    audio.volume = 0;
    const p = audio.play();
    if (p && typeof p.then === 'function') {
      p
        .then(() => {
          audio.pause();
          audio.currentTime = 0;
          audio.volume = 0.75;
        })
        .catch(() => {
          audio.volume = 0.75;
        });
    }
  } catch {
    if (audio) audio.volume = 0.75;
  }
}

function playBeep() {
  const audio = getAudio();
  if (!audio) return;
  try {
    audio.currentTime = 0;
    audio.volume = 0.75;
    const p = audio.play();
    if (p && typeof p.catch === 'function') {
      p.catch(() => undefined);
    }
  } catch {
    // ignore
  }
}

export function FloatingWhatsApp() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const [phone, setPhone] = useState('');
  const [bubble, setBubble] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    function onFirst() {
      warmupAudio();
    }
    window.addEventListener('pointerdown', onFirst, { once: true });
    window.addEventListener('keydown', onFirst, { once: true });
    window.addEventListener('touchstart', onFirst, { once: true });
    window.addEventListener('click', onFirst, { once: true });
    return () => {
      window.removeEventListener('pointerdown', onFirst);
      window.removeEventListener('keydown', onFirst);
      window.removeEventListener('touchstart', onFirst);
      window.removeEventListener('click', onFirst);
    };
  }, []);

  useEffect(() => {
    fetch('/api/whatsapp')
      .then((r) => r.json())
      .then((data: { phone?: string }) => setPhone(data.phone ?? ''))
      .catch(() => setPhone(''));
  }, []);

  useEffect(() => {
    if (pathname?.startsWith('/admin')) return;
    if (typeof window === 'undefined') return;

    let cancelled = false;
    let timer: number | null = null;

    function scheduleNext(delay: number, action: () => void) {
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        if (cancelled) return;
        action();
      }, delay);
    }

    function showBubble() {
      if (cancelled) return;
      setBubble(true);
      playBeep();
      scheduleNext(VISIBLE_MS, () => {
        if (cancelled) return;
        setBubble(false);
        scheduleNext(HIDDEN_MS, showBubble);
      });
    }

    scheduleNext(FIRST_DELAY_MS, showBubble);

    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [pathname]);

  if (pathname?.startsWith('/admin')) return null;

  const digits = cleanNumber(phone);
  if (digits.length < 8) return null;

  const href = 'https://wa.me/' + digits + '?text=' + encodeURIComponent(MESSAGE);

  return (
    <>
      {bubble && (
        <a
          className="wa-bubble"
          href={href}
          target="_blank"
          rel="noreferrer noopener"
          aria-label={t('wa.ariaLabel')}
          onClick={() => setBubble(false)}
        >
          <svg
            className="wa-bubble__svg"
            viewBox="0 0 220 70"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              className="wa-bubble__shape"
              d="M 34 4 L 166 4 Q 196 4 196 34 L 214 34 L 196 44 Q 196 66 166 66 L 34 66 Q 4 66 4 34 Q 4 4 34 4 Z"
            />
            <path
              className="wa-bubble__orbit"
              d="M 34 4 L 166 4 Q 196 4 196 34 L 214 34 L 196 44 Q 196 66 166 66 L 34 66 Q 4 66 4 34 Q 4 4 34 4 Z"
              strokeDasharray="70 620"
            />
            <text
              className="wa-bubble__label"
              x="100"
              y="36"
              textAnchor="middle"
            >
              {t('wa.bubble')}
            </text>
          </svg>
        </a>
      )}

      <a
        className="floating-whatsapp"
        href={href}
        target="_blank"
        rel="noreferrer noopener"
        aria-label={t('wa.ariaLabel')}
        onClick={() => setBubble(false)}
      >
        <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28" aria-hidden="true">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
        </svg>
      </a>
    </>
  );
}