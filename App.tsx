
import React, { useState, useCallback, useMemo } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatWindow } from './components/ChatWindow';
import LiveSession from './components/LiveSession';
import { ChatMessage, MessageRole, ChatSession } from './types';
import { streamChat } from './services/geminiService';

const App: React.FC = () => {
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLiveOpen, setIsLiveOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const activeChat = useMemo(() => 
    chats.find(c => c.id === activeChatId) || null,
  [chats, activeChatId]);

  const handleSendMessage = useCallback(async (text: string) => {
    let currentChatId = activeChatId;
    let updatedChats = [...chats];

    // If no active chat, create one
    if (!currentChatId) {
      currentChatId = Date.now().toString();
      const newChat: ChatSession = {
        id: currentChatId,
        title: text.length > 25 ? text.substring(0, 25) + '...' : text,
        messages: [],
        lastUpdated: new Date()
      };
      updatedChats = [newChat, ...updatedChats];
      setChats(updatedChats);
      setActiveChatId(currentChatId);
    }

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: MessageRole.USER,
      content: text,
      timestamp: new Date()
    };

    const assistantMsgId = (Date.now() + 1).toString();
    const assistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: MessageRole.MODEL,
      content: '',
      timestamp: new Date()
    };

    // Update state with user message and placeholder model message
    setChats(prev => prev.map(c => 
      c.id === currentChatId 
        ? { ...c, messages: [...c.messages, userMsg, assistantMsg], lastUpdated: new Date() } 
        : c
    ));

    setIsLoading(true);

    try {
      const currentMessages = activeChat 
        ? [...activeChat.messages, userMsg] 
        : [userMsg];

      let fullContent = '';
      await streamChat(currentMessages, (chunk) => {
        fullContent += chunk;
        setChats(prev => prev.map(c => 
          c.id === currentChatId 
            ? { 
                ...c, 
                messages: c.messages.map(m => 
                  m.id === assistantMsgId ? { ...m, content: fullContent } : m
                ) 
              } 
            : c
        ));
      });
    } catch (err) {
      console.error('Chat error:', err);
      setChats(prev => prev.map(c => 
        c.id === currentChatId 
          ? { 
              ...c, 
              messages: c.messages.map(m => 
                m.id === assistantMsgId ? { ...m, content: 'Sorry, I encountered an error. Please try again.' } : m
              ) 
            } 
          : c
      ));
    } finally {
      setIsLoading(false);
    }
  }, [chats, activeChatId, activeChat]);

  const handleNewChat = () => {
    setActiveChatId(null);
    setIsSidebarOpen(false);
    setIsLoading(false);
  };

  const handleSelectChat = (id: string) => {
    setActiveChatId(id);
    setIsSidebarOpen(false);
    setIsLoading(false);
  };

  const handleDeleteChat = useCallback((id: string) => {
    setChats(prev => prev.filter(chat => chat.id !== id));
    if (activeChatId === id) {
      setActiveChatId(null);
      setIsLoading(false);
    }
  }, [activeChatId]);

  return (
    <div className="flex h-screen bg-black text-white selection:bg-blue-500/30 overflow-hidden relative">
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        onNewChat={handleNewChat} 
        chats={chats}
        activeChatId={activeChatId}
        onSelectChat={handleSelectChat}
        onDeleteChat={handleDeleteChat}
      />
      
      <main className="flex-1 overflow-hidden relative w-full">
        <ChatWindow 
          messages={activeChat?.messages || []}
          isLoading={isLoading}
          onSendMessage={handleSendMessage}
          onOpenLive={() => setIsLiveOpen(true)}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />
      </main>

      {isLiveOpen && (
        <LiveSession onClose={() => setIsLiveOpen(false)} />
      )}
    </div>
  );
};

export default App;
