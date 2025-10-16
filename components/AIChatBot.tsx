import React, { useState, useEffect, useRef } from 'react';
import { useAIService } from '../lib/hooks/useAIService';
import type { ChatRequest } from '../lib/aiTrainingService';
import type { UpcomingSessionPayload } from '../lib/trainingSessions';

interface AIChatBotProps {
  isOpen: boolean;
  onClose: () => void;
  context?: {
    currentExercise?: string;
    sessionData?: UpcomingSessionPayload;
    userLevel?: 'beginner' | 'intermediate' | 'advanced';
  };
}

interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export const AIChatBot: React.FC<AIChatBotProps> = ({ isOpen, onClose, context }) => {
  const { chatWithAI, isLoading, error } = useAIService();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      text: 'こんにちは！トレーニングに関する質問があれば何でもお聞きください。フォーム、プログラム、栄養、回復など、科学的根拠に基づいたアドバイスを提供します。',
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: inputMessage.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');

    const request: ChatRequest = {
      message: userMessage.text,
      context,
    };

    const aiResponse = await chatWithAI(request);
    
    if (aiResponse) {
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: aiResponse,
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);
    }
  };

  const quickQuestions = [
    'フォームが正しいか不安です',
    '重量が上がらない理由は？',
    'デロードのタイミングは？',
    'RIRの使い方を教えて',
    '筋肉痛がひどい時は？',
  ];

  const handleQuickQuestion = (question: string) => {
    setInputMessage(question);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-end sm:justify-end bg-black/50 sm:bg-transparent">
      {/* モバイル：画面全体、デスクトップ：右下に配置 */}
      <div className="h-full w-full sm:h-[600px] sm:w-full sm:max-w-md sm:mb-4 sm:mr-4 rounded-none sm:rounded-3xl border-0 sm:border sm:border-slate-200 bg-white shadow-2xl shadow-slate-900/20 flex flex-col modal-content">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4 sm:py-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 sm:h-8 sm:w-8 rounded-full bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center shrink-0">
              <span className="text-white text-base sm:text-sm font-semibold">AI</span>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-base sm:text-sm">トレーニングAI</h3>
              <p className="text-sm sm:text-xs text-slate-500">
                {context?.currentExercise ? `現在: ${context.currentExercise}` : 'いつでも質問OK'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:text-slate-600 min-h-touch min-w-touch flex items-center justify-center"
            aria-label="閉じる"
          >
            <svg className="h-6 w-6 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 overscroll-contain">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] sm:max-w-[80%] rounded-2xl px-4 py-3 sm:px-3 sm:py-2 text-base sm:text-sm ${
                  message.isUser
                    ? 'bg-primary text-white'
                    : 'bg-slate-100 text-slate-900'
                }`}
              >
                <p className="whitespace-pre-wrap leading-relaxed">{message.text}</p>
                <p className={`mt-2 sm:mt-1 text-sm sm:text-xs ${message.isUser ? 'text-cyan-200' : 'text-slate-500'}`}>
                  {message.timestamp.toLocaleTimeString('ja-JP', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[85%] sm:max-w-[80%] rounded-2xl bg-slate-100 px-4 py-3 sm:px-3 sm:py-2">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 sm:h-2 sm:w-2 rounded-full bg-slate-400 animate-pulse"></div>
                  <div className="h-2.5 w-2.5 sm:h-2 sm:w-2 rounded-full bg-slate-400 animate-pulse animation-delay-100"></div>
                  <div className="h-2.5 w-2.5 sm:h-2 sm:w-2 rounded-full bg-slate-400 animate-pulse animation-delay-200"></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick questions (only if no messages from user yet) */}
        {messages.length === 1 && (
          <div className="border-t border-slate-100 px-4 py-3 sm:py-2 shrink-0">
            <p className="text-sm sm:text-xs text-slate-500 mb-2">よくある質問:</p>
            <div className="flex flex-wrap gap-2 sm:gap-1">
              {quickQuestions.slice(0, 3).map((question, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickQuestion(question)}
                  className="rounded-full bg-slate-100 px-3 py-2 sm:px-2 sm:py-1 text-sm sm:text-xs text-slate-600 hover:bg-slate-200 transition min-h-touch"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <form onSubmit={handleSendMessage} className="border-t border-slate-100 p-4 shrink-0 bg-white">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="質問を入力..."
              className="flex-1 rounded-xl border border-slate-200 px-4 py-3 sm:px-3 sm:py-2 text-base sm:text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              className="rounded-xl bg-primary px-4 py-3 sm:px-3 sm:py-2 text-white transition hover:bg-primary-dark disabled:opacity-50 min-h-touch min-w-touch flex items-center justify-center"
              aria-label="送信"
            >
              <svg className="h-5 w-5 sm:h-4 sm:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
          
          {error && (
            <p className="mt-2 text-sm sm:text-xs text-red-600">{error}</p>
          )}
        </form>
      </div>
    </div>
  );
};