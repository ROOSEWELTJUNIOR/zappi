import { useState } from 'react';
import {
  Smartphone, QrCode, RefreshCw, PowerOff, Trash2,
  Wifi, WifiOff, Loader2, MoreVertical,
} from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Connection, ConnectionStatus } from '@/types/evolution';

interface ConnectionCardProps {
  connection: Connection;
  onConnect: () => void;
  onDisconnect: () => Promise<void>;
  onReconnect: () => Promise<void>;
  onDelete: () => Promise<void>;
}

function StatusBadge({ status }: { status: ConnectionStatus }) {
  switch (status) {
    case 'OPEN':
      return <Badge variant="success" className="h-5">Conectado</Badge>;
    case 'CONNECTING':
      return <Badge variant="warning" className="h-5">Conectando…</Badge>;
    case 'QRCODE':
      return <Badge variant="warning" className="h-5">Aguardando QR Code</Badge>;
    case 'CLOSED':
      return <Badge variant="error" className="h-5">Fechado</Badge>;
    default:
      return <Badge variant="error" className="h-5">Offline</Badge>;
  }
}

function StatusIcon({ status }: { status: ConnectionStatus }) {
  const cls = 'h-6 w-6';
  if (status === 'OPEN')
    return (
      <Wifi
        className={`${cls} text-emerald-500`}
      />
    );
  if (status === 'CONNECTING')
    return <Loader2 className={`${cls} text-amber-500 animate-spin`} />;
  if (status === 'QRCODE')
    return <QrCode className={`${cls} text-amber-500`} />;
  return <WifiOff className={`${cls} text-red-500`} />;
}

const iconBg: Record<ConnectionStatus, string> = {
  OPEN: 'bg-emerald-500/10 text-emerald-500',
  CONNECTING: 'bg-amber-500/10 text-amber-500',
  QRCODE: 'bg-amber-500/10 text-amber-500',
  CLOSED: 'bg-red-500/10 text-red-500',
  OFFLINE: 'bg-red-500/10 text-red-500',
};

export function ConnectionCard({
  connection,
  onConnect,
  onDisconnect,
  onReconnect,
  onDelete,
}: ConnectionCardProps) {
  const { instanceName, displayName, status, phone, profilePicUrl, profileName } = connection;
  const isOpen = status === 'OPEN';
  const isPending = status === 'QRCODE' || status === 'CONNECTING';
  const [deleting, setDeleting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    await onDelete();
    setDeleting(false);
  }

  async function handleDisconnect() {
    setDisconnecting(true);
    await onDisconnect();
    setDisconnecting(false);
  }

  async function handleReconnect() {
    setReconnecting(true);
    await onReconnect();
    setReconnecting(false);
  }

  return (
    <Card
      className={`flex flex-col relative overflow-hidden transition-all ${
        isOpen ? 'border-primary/20 bg-primary/5' : ''
      }`}
    >
      {/* Live indicator */}
      {isOpen && (
        <div className="absolute top-0 right-0 p-4">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
          </span>
        </div>
      )}

      <CardHeader className="pb-4">
        <div className="flex items-center gap-3 mb-2 pr-4">
          {/* Avatar or icon */}
          {isOpen && profilePicUrl ? (
            <Avatar className="h-11 w-11 border border-border">
              <AvatarImage src={profilePicUrl} alt={profileName ?? instanceName} />
              <AvatarFallback className={`${iconBg[status]} text-sm`}>
                {displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          ) : (
            <div className={`p-2.5 rounded-xl flex items-center justify-center ${iconBg[status]}`}>
              <StatusIcon status={status} />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg truncate">
              {profileName ?? displayName}
            </CardTitle>
            <CardDescription className="font-mono mt-0.5 text-sm truncate">
              {phone ?? instanceName}
            </CardDescription>
          </div>

          {/* Actions menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0 text-muted-foreground">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {!isOpen && (
                <DropdownMenuItem onClick={onConnect}>
                  <QrCode className="h-4 w-4 mr-2" />
                  Conectar / QR Code
                </DropdownMenuItem>
              )}
              {isOpen && (
                <DropdownMenuItem onClick={handleDisconnect} disabled={disconnecting}>
                  <PowerOff className="h-4 w-4 mr-2" />
                  Desconectar
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={handleReconnect} disabled={reconnecting}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Reconectar / Reiniciar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive focus:bg-destructive/10"
                onClick={handleDelete}
                disabled={deleting}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir Instância
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="flex-1">
        <div className="bg-card/50 border border-border rounded-lg p-3 space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Status</span>
            <StatusBadge status={status} />
          </div>

          {isOpen && profileName && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Nome WhatsApp</span>
              <span className="font-medium truncate max-w-[140px]">{profileName}</span>
            </div>
          )}

          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Instância</span>
            <span className="font-mono text-xs text-muted-foreground truncate max-w-[140px]">
              {instanceName}
            </span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-0 mt-auto">
        {isOpen ? (
          <div className="flex gap-2 w-full">
            <Button
              variant="outline"
              className="flex-1 text-xs"
              size="sm"
              onClick={handleReconnect}
              disabled={reconnecting}
            >
              {reconnecting ? (
                <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3 mr-1.5" />
              )}
              Reiniciar
            </Button>
            <Button
              variant="destructive"
              className="flex-1 text-xs bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border-transparent"
              size="sm"
              onClick={handleDisconnect}
              disabled={disconnecting}
            >
              {disconnecting ? (
                <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
              ) : (
                <PowerOff className="h-3 w-3 mr-1.5" />
              )}
              Desconectar
            </Button>
          </div>
        ) : isPending ? (
          <Button className="w-full shadow-[0_0_16px_rgba(124,58,237,0.2)]" onClick={onConnect}>
            <QrCode className="h-4 w-4 mr-2" />
            Ler QR Code
          </Button>
        ) : (
          <Button
            className="w-full bg-sidebar border border-sidebar-border hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-foreground"
            onClick={handleReconnect}
            disabled={reconnecting}
          >
            {reconnecting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Reconectar
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
