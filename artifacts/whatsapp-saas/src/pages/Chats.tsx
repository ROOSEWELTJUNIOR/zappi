import { useState } from "react"
import { Search, MessageSquarePlus, Filter, MoreVertical, Paperclip, Send, Mic, Phone, Video } from "lucide-react"

import { Breadcrumb } from "@/components/Breadcrumb"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

const mockChats = [
  { id: 1, name: "Maria Oliveira", phone: "+55 11 99999-1234", lastMessage: "Sim, eu gostaria de confirmar o pedido.", time: "10:42", unread: 2, status: "online" },
  { id: 2, name: "Carlos Santos", phone: "+55 21 98888-5678", lastMessage: "Qual o valor do frete para o RJ?", time: "09:15", unread: 0, status: "offline" },
  { id: 3, name: "Ana Beatriz", phone: "+55 31 97777-9012", lastMessage: "Obrigada! Aguardo o envio.", time: "Ontem", unread: 0, status: "online" },
  { id: 4, name: "João Pedro", phone: "+55 41 96666-3456", lastMessage: "Vocês parcelam em quantas vezes?", time: "Ontem", unread: 5, status: "offline" },
  { id: 5, name: "Fernanda Costa", phone: "+55 51 95555-7890", lastMessage: "Ok, vou pensar e te aviso.", time: "Segunda", unread: 0, status: "online" },
]

export default function Chats() {
  const [activeChat, setActiveChat] = useState(mockChats[0].id)
  
  const currentChat = mockChats.find(c => c.id === activeChat)

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      <div className="flex justify-between items-center mb-4">
        <div>
          <Breadcrumb className="mb-2" />
          <h1 className="text-2xl font-bold tracking-tight">Chats</h1>
          <p className="text-sm text-muted-foreground">Gerencie suas conversas do WhatsApp.</p>
        </div>
        <Button className="gap-2">
          <MessageSquarePlus className="h-4 w-4" />
          Nova Conversa
        </Button>
      </div>

      <div className="flex flex-1 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        {/* Chat List Sidebar */}
        <div className="w-[320px] flex flex-col border-r border-border bg-card/50">
          <div className="p-4 border-b border-border space-y-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar conversas..."
                className="pl-9 bg-background"
              />
            </div>
            <div className="flex gap-2">
              <Badge variant="secondary" className="cursor-pointer">Todos</Badge>
              <Badge variant="outline" className="cursor-pointer">Não lidos</Badge>
              <Badge variant="outline" className="cursor-pointer">Grupos</Badge>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {mockChats.map((chat) => (
              <div 
                key={chat.id}
                onClick={() => setActiveChat(chat.id)}
                className={`flex gap-3 p-4 border-b border-border/50 cursor-pointer hover:bg-accent/50 transition-colors ${activeChat === chat.id ? 'bg-accent/80' : ''}`}
              >
                <div className="relative">
                  <Avatar>
                    <AvatarFallback className="bg-primary/20 text-primary">
                      {chat.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {chat.status === 'online' && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 border-2 border-card bg-emerald-500 rounded-full"></span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <h4 className="text-sm font-semibold truncate pr-2">{chat.name}</h4>
                    <span className="text-xs text-muted-foreground shrink-0">{chat.time}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-muted-foreground truncate pr-2">{chat.lastMessage}</p>
                    {chat.unread > 0 && (
                      <span className="bg-primary text-primary-foreground text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shrink-0">
                        {chat.unread}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-background/30 relative">
          {currentChat ? (
            <>
              {/* Chat Header */}
              <div className="h-[72px] px-6 border-b border-border flex items-center justify-between bg-card/80 backdrop-blur-sm z-10">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback className="bg-primary/20 text-primary">
                      {currentChat.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{currentChat.name}</h3>
                    <p className="text-xs text-muted-foreground">{currentChat.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Video className="h-4 w-4" />
                  </Button>
                  <div className="w-px h-6 bg-border mx-1"></div>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Search className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
                <div className="text-center my-4">
                  <span className="text-xs font-medium bg-muted px-3 py-1 rounded-full text-muted-foreground">Hoje</span>
                </div>
                
                <div className="flex gap-3 max-w-[80%]">
                  <Avatar className="h-8 w-8 mt-auto">
                    <AvatarFallback className="bg-primary/20 text-primary text-xs">
                      {currentChat.name.substring(0, 1)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-card border border-border p-3 rounded-2xl rounded-bl-sm">
                    <p className="text-sm">Olá! Vi o anúncio de vocês no Instagram.</p>
                    <span className="text-[10px] text-muted-foreground mt-1 block text-right">10:40</span>
                  </div>
                </div>

                <div className="flex gap-3 max-w-[80%] self-end flex-row-reverse">
                  <div className="bg-primary text-primary-foreground p-3 rounded-2xl rounded-br-sm shadow-[0_4px_12px_rgba(124,58,237,0.2)]">
                    <p className="text-sm">Olá, {currentChat.name.split(' ')[0]}! Tudo bem? Como posso te ajudar hoje?</p>
                    <span className="text-[10px] text-primary-foreground/70 mt-1 block text-right">10:41</span>
                  </div>
                </div>

                <div className="flex gap-3 max-w-[80%]">
                  <Avatar className="h-8 w-8 mt-auto">
                    <AvatarFallback className="bg-primary/20 text-primary text-xs">
                      {currentChat.name.substring(0, 1)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-card border border-border p-3 rounded-2xl rounded-bl-sm">
                    <p className="text-sm">{currentChat.lastMessage}</p>
                    <span className="text-[10px] text-muted-foreground mt-1 block text-right">{currentChat.time}</span>
                  </div>
                </div>
              </div>

              {/* Chat Input */}
              <div className="p-4 bg-card border-t border-border">
                <div className="flex items-end gap-2 bg-background border border-border rounded-xl p-2 focus-within:ring-1 focus-within:ring-primary focus-within:border-primary transition-all">
                  <Button variant="ghost" size="icon" className="shrink-0 h-10 w-10 text-muted-foreground hover:text-foreground">
                    <Paperclip className="h-5 w-5" />
                  </Button>
                  <textarea 
                    className="flex-1 max-h-32 min-h-[40px] bg-transparent resize-none outline-none py-2 text-sm"
                    placeholder="Digite uma mensagem..."
                    rows={1}
                  />
                  <Button variant="ghost" size="icon" className="shrink-0 h-10 w-10 text-muted-foreground hover:text-foreground">
                    <Mic className="h-5 w-5" />
                  </Button>
                  <Button size="icon" className="shrink-0 h-10 w-10 rounded-lg shadow-[0_0_12px_rgba(124,58,237,0.4)]">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
              <MessageSquarePlus className="h-12 w-12 mb-4 opacity-20" />
              <p>Selecione uma conversa para começar</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
