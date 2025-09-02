import React, { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';

interface EmailComposerProps {
  onSendEmails: (subject: string, message: string) => void;
  isLoading: boolean;
  canSend: boolean;
}

export const EmailComposer: React.FC<EmailComposerProps> = ({
  onSendEmails,
  isLoading,
  canSend
}) => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (canSend && subject.trim() && message.trim()) {
      onSendEmails(subject, message);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Compose Email</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
            Subject
          </label>
          <input
            type="text"
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter email subject"
            required
          />
        </div>
        
        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
            Message
          </label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter your message to students..."
            required
          />
        </div>
        
        <button
          type="submit"
          disabled={!canSend || !subject.trim() || !message.trim() || isLoading}
          className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin h-4 w-4 mr-2" />
              Sending Emails...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Send to All Students
            </>
          )}
        </button>
      </form>
    </div>
  );
};