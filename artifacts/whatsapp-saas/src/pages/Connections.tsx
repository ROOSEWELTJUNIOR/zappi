import { useState } from 'react';
import { Plus, AlertCircle, RefreshCw, Loader2, Wifi } from 'lucide-react';
import { Breadcrumb } from '@/components/Breadcrumb';
import { Button } from '@/components/ui/button';
import { ConnectionCard } from '@/components/connections/ConnectionCard';
import { QRCodeModal } from '@/components/connections/QRCodeModal';
import { NewConnectionModal } from '@/components/connections/NewConnectionModal';
import { useConnections } from '@/hooks/useConnections';

export default function Connections() {
  const {
    connections,
    loading,
    error,
    fetchAll,
    addConnection,
    removeConnection,
    disconnectConnection,
    reconnectConnection,
    refreshStatus,
    getQRCode,
  } = useConnections();

  const [newModalOpen, setNewModalOpen] = useState(false);
  const [qrInstance, setQrInstance] = useState<string | null>(null);

  function openQR(instanceName: string) {
    setQrInstance(instanceName);
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex justify-between items-start sm:items-center flex-col sm:flex-row gap-4">
        <div>
          <Breadcrumb className="mb-2" />
          <h1 className="text-3xl font-bold tracking-tight">Conexões</h1>
          <p className="text-muted-foreground mt-1">
            Conecte e gerencie seus números de WhatsApp via Evolution API.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => fetchAll()}
            disabled={loading}
            title="Atualizar"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button className="gap-2" onClick={() => setNewModalOpen(true)}>
            <Plus className="h-4 w-4" />
            Nova Conexão
          </Button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="flex items-start gap-3 p-4 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-sm">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Erro ao conectar com a Evolution API</p>
            <p className="text-destructive/80 mt-0.5">{error}</p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 h-7 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => fetchAll()}
            >
              Tentar novamente
            </Button>
          </div>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && connections.length === 0 && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-[280px] rounded-xl border border-border bg-card animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && connections.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="h-16 w-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
            <Wifi className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-semibold mb-1">Nenhuma conexão encontrada</h3>
          <p className="text-muted-foreground text-sm mb-6 max-w-xs">
            Crie sua primeira instância para começar a usar o WhatsApp.
          </p>
          <Button onClick={() => setNewModalOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Conexão
          </Button>
        </div>
      )}

      {/* Connection cards */}
      {connections.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {connections.map((conn) => (
            <ConnectionCard
              key={conn.instanceName}
              connection={conn}
              onConnect={() => openQR(conn.instanceName)}
              onDisconnect={() => disconnectConnection(conn.instanceName)}
              onReconnect={() => reconnectConnection(conn.instanceName)}
              onDelete={() => removeConnection(conn.instanceName)}
            />
          ))}

          {/* Add placeholder */}
          <button
            onClick={() => setNewModalOpen(true)}
            className="flex flex-col items-center justify-center border-dashed border-2 border-border hover:border-primary/50 transition-colors bg-transparent rounded-xl cursor-pointer group min-h-[280px]"
          >
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors mb-4">
              <Plus className="h-6 w-6" />
            </div>
            <h3 className="font-semibold text-lg">Adicionar Número</h3>
            <p className="text-sm text-muted-foreground text-center mt-2 px-6">
              Conecte um novo número de WhatsApp à sua conta.
            </p>
          </button>
        </div>
      )}

      {/* Modals */}
      <NewConnectionModal
        open={newModalOpen}
        onOpenChange={setNewModalOpen}
        onCreate={addConnection}
      />

      {qrInstance && (
        <QRCodeModal
          open={!!qrInstance}
          instanceName={qrInstance}
          onOpenChange={(v) => { if (!v) setQrInstance(null); }}
          onGetQR={getQRCode}
          onRefreshStatus={refreshStatus}
        />
      )}
    </div>
  );
}
