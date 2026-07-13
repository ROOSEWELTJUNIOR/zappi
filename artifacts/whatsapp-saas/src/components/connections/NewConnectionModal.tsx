import { useState } from 'react';
import { Loader2, Plus, Smartphone } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface NewConnectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (name: string) => Promise<boolean>;
}

export function NewConnectionModal({ open, onOpenChange, onCreate }: NewConnectionModalProps) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sanitise = (v: string) =>
    v
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-_]/g, '');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const sanitised = sanitise(name);
    if (!sanitised) {
      setError('Informe um nome válido (letras, números e hífen).');
      return;
    }
    setLoading(true);
    setError(null);
    const ok = await onCreate(sanitised);
    setLoading(false);
    if (ok) {
      setName('');
      onOpenChange(false);
    }
  }

  function handleClose(v: boolean) {
    if (loading) return;
    setName('');
    setError(null);
    onOpenChange(v);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle>Nova Conexão</DialogTitle>
              <DialogDescription className="mt-0.5">
                Uma nova instância será criada na Evolution API.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="instance-name">Nome da instância</Label>
            <Input
              id="instance-name"
              placeholder="ex: suporte-principal"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
              disabled={loading}
              className="bg-background/50"
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              Use letras minúsculas, números e hífen. Será convertido automaticamente.
            </p>
            {name && (
              <p className="text-xs text-primary font-mono">
                → {sanitise(name) || '(inválido)'}
              </p>
            )}
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleClose(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !name.trim()}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Criando…
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Instância
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
