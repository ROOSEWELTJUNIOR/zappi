import { MessageSquare } from 'lucide-react';

export function ChatEmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 text-muted-foreground select-none">
      <div className="relative">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
          <MessageSquare className="w-9 h-9 text-primary/50" />
        </div>
        <span className="absolute -bottom-1 -right-1 text-2xl">💬</span>
      </div>
      <div className="text-center space-y-1">
        <p className="font-semibold text-foreground/70">Nenhuma conversa selecionada</p>
        <p className="text-sm">Selecione uma conversa para começar.</p>
      </div>
    </div>
  );
}
