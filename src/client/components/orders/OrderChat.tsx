import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare } from 'lucide-react';
import { IOrderMessage, IUser } from '../../../shared/types';
import { format } from 'date-fns';

interface OrderChatProps {
    orderId: string;
    messages: IOrderMessage[];
    currentUser: IUser | null;
    onSendMessage: (orderId: string, text: string) => void;
    isReadOnly?: boolean;
}

export const OrderChat: React.FC<OrderChatProps> = ({ orderId, messages = [], currentUser, onSendMessage, isReadOnly }) => {
    const [newMessage, setNewMessage] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

    const handleSend = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!newMessage.trim()) return;

        onSendMessage(orderId, newMessage);
        setNewMessage('');
        // Keep open to see the message
        if (!isOpen) setIsOpen(true);
    };

    // If there are messages, show the last one as a preview if closed
    const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;

    return (
        <div className="mt-4 border-t border-slate-50 pt-2">
            {!isOpen ? (
                <button
                    onClick={() => setIsOpen(true)}
                    className="flex items-center space-x-2 text-sm text-slate-500 hover:text-slate-700 transition-colors w-full text-left group"
                >
                    <div className="bg-slate-100 p-2 rounded-full group-hover:bg-slate-200 transition-colors relative">
                        <MessageSquare className="w-4 h-4 text-slate-500" />
                        {messages.length > 0 && (
                            <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                                {messages.length}
                            </span>
                        )}
                    </div>
                    <div className="flex-1 truncate">
                        {lastMessage ? (
                            <span className="text-slate-400 italic">
                                <span className="font-bold text-slate-600 not-italic mr-1">{lastMessage.isAdmin ? 'Admin' : lastMessage.sender}:</span>
                                {lastMessage.text}
                            </span>
                        ) : (
                            <span className="text-slate-400">Add a note or message...</span>
                        )}
                    </div>
                </button>
            ) : (
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                    <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2 flex justify-between items-center border-b border-slate-200 dark:border-slate-700">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Messages</span>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-xs text-slate-400 hover:text-slate-600 font-medium"
                        >
                            Hide
                        </button>
                    </div>

                    <div className="max-h-60 overflow-y-auto p-4 space-y-3">
                        {messages.length === 0 && (
                            <p className="text-center text-xs text-slate-400 italic py-4">No messages yet. Start the conversation!</p>
                        )}
                        {messages.map((msg) => {
                            const isMe = msg.sender === currentUser?.username;
                            const isAdmin = msg.isAdmin;

                            return (
                                <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                    <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${isMe
                                            ? 'bg-rose-500 text-white rounded-br-none'
                                            : isAdmin
                                                ? 'bg-slate-800 text-white rounded-bl-none'
                                                : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none'
                                        }`}>
                                        <p>{msg.text}</p>
                                    </div>
                                    <span className="text-[10px] text-slate-400 mt-1 px-1">
                                        {isMe ? 'You' : (isAdmin ? 'Admin' : msg.sender)} • {format(new Date(msg.timestamp), 'MMM d, h:mm a')}
                                    </span>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>

                    {!isReadOnly && (
                        <form onSubmit={handleSend} className="p-2 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 flex items-center space-x-2">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Type a message..."
                                className="flex-1 bg-transparent border-none text-sm focus:ring-0 placeholder:text-slate-400"
                            />
                            <button
                                type="submit"
                                disabled={!newMessage.trim()}
                                className="p-2 bg-slate-100 dark:bg-slate-700 rounded-full text-slate-500 hover:text-rose-600 disabled:opacity-50 disabled:hover:text-slate-500 transition-colors"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </form>
                    )}
                </div>
            )}
        </div>
    );
};
