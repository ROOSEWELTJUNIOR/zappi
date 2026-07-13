import { useState, useEffect, useCallback, useRef } from 'react';
import { Loader2, RefreshCw, QrCode, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { ConnectionStatus } from '@/types/evolution';

const QR_REFRESH_MS = 20_000; // refresh QR every 20 s while still pending
const STATUS_POLL_MS = 3_000;  // poll status every 3 s

interface QRCodeModalProps {
  open: boolean;
  instanceName: string;
  onOpenChange: (open: boolean) => void;
  onGetQR: (instanceName: string) => Promise<string | null>;
  onRefreshStatus: (instanceName: string) => Promise<ConnectionStatus | null>;
}

export function QRCodeModal({
  open,
  instanceName,
  onOpenChange,
  onGetQR,
  onRefreshStatus,
}: QRCodeModalProps) {
  const [qr, setQr] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [connected, setConnected] = useState(false);

  const qrTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const statusTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimers = useCallback(() => {
    if (qrTimerRef.current) { clearInterval(qrTimerRef.current); qrTimerRef.current = null; }
    if (statusTimerRef.current) { clearInterval(statusTimerRef.current); statusTimerRef.current = null; }
  }, []);

  const loadQR = useCallback(async () => {
    setQrLoading(true);
    const b64 = await onGetQR(instanceName);
    setQrLoading(false);
    if (b64) setQr(b64);
  }, [instanceName, onGetQR]);

  // Poll connection status — close modal automatically when connected
  const pollStatus = useCallback(async () => {
    const status = await onRefreshStatus(instanceName);
    if (status === 'OPEN') {
      clearTimers();
      setConnected(true);
      toast.success('WhatsApp conectado com sucesso! 🎉');
      // Close modal after brief success display
      setTimeout(() => {
        setConnected(false);
        onOpenChange(false);
      }, 2000);
    }
  }, [instanceName, onRefreshStatus, onOpenChange, clearTimers]);

  useEffect(() => {
    if (!open) {
      clearTimers();
      setQr(null);
      setConnected(false);
      return;
    }

    // Load QR immediately
    loadQR();

    // Refresh QR periodically while modal is open and not connected
    qrTimerRef.current = setInterval(loadQR, QR_REFRESH_MS);

    // Poll status
    statusTimerRef.current = setInterval(pollStatus, STATUS_POLL_MS);

    return () => clearTimers();
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleClose(v: boolean) {
    if (!v) clearTimers();
    onOpenChange(v);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <QrCode className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle>Conectar WhatsApp</DialogTitle>
              <DialogDescription className="mt-0.5 font-mono text-xs">
                {instanceName}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-2">
          {connected ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <CheckCircle2 className="h-16 w-16 text-emerald-500" />
              <p className="font-semibold text-emerald-500">Conectado com sucesso!</p>
            </div>
          ) : (
            <>
              {/* QR code area */}
              <div className="relative w-56 h-56 rounded-2xl overflow-hidden border border-border bg-white flex items-center justify-center">
                {qrLoading && !qr ? (
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                ) : qr ? (
                  <>
                    <img src={qr} alt="QR Code WhatsApp" className="w-full h-full object-contain" />
                    {qrLoading && (
                      <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground text-center px-4">
                    Não foi possível carregar o QR Code.
                  </p>
                )}
              </div>

              <ol className="text-xs text-muted-foreground space-y-1 text-left w-full pl-2">
                <li>1. Abra o WhatsApp no celular</li>
                <li>2. Toque em <span className="font-medium">Configurações → Dispositivos vinculados</span></li>
                <li>3. Escaneie este QR Code</li>
              </ol>

              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2"
                onClick={loadQR}
                disabled={qrLoading}
              >
                <RefreshCw className={`h-3.5 w-3.5 ${qrLoading ? 'animate-spin' : ''}`} />
                Atualizar QR Code
              </Button>

              <p className="text-[10px] text-muted-foreground">
                Aguardando leitura… atualiza automaticamente a cada 20 s.
              </p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
