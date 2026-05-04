'use client';

import { useState } from 'react';
import {
  Copy,
  CheckCircle2,
  Download,
  Share2,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  slug: string;
  qrUrl: string | null;
  isActive: boolean;
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

export function QRCodeModal({
  isOpen,
  onClose,
  title,
  slug,
  qrUrl,
  isActive,
}: QRCodeModalProps) {
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);

  const arUrl = `${APP_URL}/ar/${slug}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(arUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked — silently ignore */
    }
  };

  const handleDownloadPng = () => {
    if (!qrUrl) return;
    const a = document.createElement('a');
    a.href = qrUrl;
    a.download = `qr-${slug}.png`;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleShare = async () => {
    const shareData = { title: `${title} — Expérience AR`, url: arUrl };
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share(shareData);
      } catch {
        /* user cancelled */
      }
      return;
    }
    await navigator.clipboard.writeText(arUrl);
    setShared(true);
    setTimeout(() => setShared(false), 1800);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="QR Code" size="sm">
      <div className="space-y-5">
        {/* QR */}
        <div className="flex justify-center">
          <div
            className={cn(
              'w-56 h-56 rounded-2xl bg-white p-4 border border-gray-200 flex items-center justify-center',
              !isActive && 'opacity-50 grayscale',
            )}
          >
            {qrUrl ? (
              <img src={qrUrl} alt={`QR code pour ${title}`} className="w-full h-full object-contain" />
            ) : (
              <div className="text-xs text-gray-400">QR indisponible</div>
            )}
          </div>
        </div>

        <div className="text-center">
          <p className="text-sm font-medium text-gray-900 truncate">{title}</p>
          <p className="text-xs text-gray-500 font-mono mt-0.5 truncate">/{slug}</p>
        </div>

        {!isActive && (
          <div className="flex items-start gap-2 rounded-lg px-3 py-2.5 bg-amber-50 border border-amber-200 text-amber-700 text-xs">
            <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            Ce lien AR est désactivé. Réactivez-le depuis la page Liens AR pour qu'il redevienne scannable.
          </div>
        )}

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleCopy}
            className={cn(copied && 'border-emerald-300 text-emerald-700')}
          >
            {copied ? (
              <><CheckCircle2 className="w-3.5 h-3.5" />Copié !</>
            ) : (
              <><Copy className="w-3.5 h-3.5" />Copier le lien</>
            )}
          </Button>

          <Button variant="secondary" size="sm" onClick={handleDownloadPng} disabled={!qrUrl}>
            <Download className="w-3.5 h-3.5" />
            Télécharger PNG
          </Button>

          <Button variant="secondary" size="sm" onClick={handleShare}>
            {shared ? (
              <><CheckCircle2 className="w-3.5 h-3.5" />Lien copié !</>
            ) : (
              <><Share2 className="w-3.5 h-3.5" />Partager</>
            )}
          </Button>

          <Button href={arUrl} variant="primary" size="sm">
            <ExternalLink className="w-3.5 h-3.5" />
            Ouvrir
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default QRCodeModal;
