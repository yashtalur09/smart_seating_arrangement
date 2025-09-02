import React, { useState } from 'react';
import { Mail, FileText, Paperclip, School } from 'lucide-react';
import { FileUpload } from './components/FileUpload';
import { StudentPreview } from './components/StudentPreview';
import { EmailComposer } from './components/EmailComposer';
import { StatusMessage } from './components/StatusMessage';

interface Student {
  email: string;
  name: string;
  [key: string]: any;
}

interface UploadedAttachment {
  filename: string;
  path: string;
  size: number;
}

function App() {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [csvFilePath, setCsvFilePath] = useState<string>('');
  
  const [attachments, setAttachments] = useState<UploadedAttachment[]>([]);
  const [attachmentPaths, setAttachmentPaths] = useState<string[]>([]);
  
  const [status, setStatus] = useState<{
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    details?: string[];
  } | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);

  const API_BASE = 'http://localhost:5000/api';

  const handleCSVUpload = async (files: File[]) => {
    if (files.length === 0) return;
    
    const file = files[0];
    setCsvFile(file);
    setStatus(null);
    setIsLoading(true);

    const formData = new FormData();
    formData.append('csv', file);

    try {
      const response = await fetch(`${API_BASE}/upload-csv`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setStudents(data.students);
        setTotalStudents(data.totalStudents);
        setCsvFilePath(data.filePath);
        setStatus({
          type: 'success',
          message: data.message,
          details: [`Preview showing first 5 students out of ${data.totalStudents}`]
        });
      } else {
        setStatus({
          type: 'error',
          message: data.error || 'Failed to process CSV file'
        });
      }
    } catch (error) {
      console.error('CSV Upload Error:', error);
      setStatus({
        type: 'error',
        message: 'Failed to upload CSV file. Make sure the server is running on port 5000.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAttachmentUpload = async (files: File[]) => {
    if (files.length === 0) return;
    
    setIsLoading(true);
    const formData = new FormData();
    files.forEach(file => {
      formData.append('attachments', file);
    });

    try {
      const response = await fetch(`${API_BASE}/upload-attachments`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setAttachments(prev => [...prev, ...data.attachments]);
        setAttachmentPaths(prev => [...prev, ...data.attachments.map((a: UploadedAttachment) => a.path)]);
        setStatus({
          type: 'success',
          message: data.message
        });
      } else {
        setStatus({
          type: 'error',
          message: data.error || 'Failed to upload attachments'
        });
      }
    } catch (error) {
      console.error('Attachment Upload Error:', error);
      setStatus({
        type: 'error',
        message: 'Failed to upload attachments. Make sure the server is running on port 5000.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
    setAttachmentPaths(prev => prev.filter((_, i) => i !== index));
  };

  const handleSendEmails = async (subject: string, message: string) => {
    if (!csvFilePath) {
      setStatus({
        type: 'error',
        message: 'Please upload a CSV file first'
      });
      return;
    }

    setIsLoading(true);
    setStatus({
      type: 'info',
      message: 'Sending emails to all students...'
    });

    try {
      const response = await fetch(`${API_BASE}/send-emails`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          csvFilePath,
          attachmentPaths,
          subject,
          message
        }),
      });

      const data = await response.json();

      if (data.success) {
        const details = [
          `Successfully sent: ${data.successCount}`,
          `Total emails: ${data.totalEmails}`
        ];
        
        if (data.failedEmails && data.failedEmails.length > 0) {
          details.push(`Failed: ${data.failedEmails.length}`);
        }

        setStatus({
          type: data.failedEmails && data.failedEmails.length > 0 ? 'warning' : 'success',
          message: data.message,
          details
        });
      } else {
        setStatus({
          type: 'error',
          message: data.error || 'Failed to send emails'
        });
      }
    } catch (error) {
      console.error('Send Email Error:', error);
      setStatus({
        type: 'error',
        message: 'Failed to send emails. Make sure the server is running and Gmail SMTP is configured.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <School className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">
                Student Email Distribution System
              </h1>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Mail className="h-4 w-4" />
              <span>Bulk Email Management</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Messages */}
        {status && (
          <div className="mb-6">
            <StatusMessage
              type={status.type}
              message={status.message}
              details={status.details}
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - File Uploads */}
          <div className="space-y-6">
            {/* CSV Upload */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center mb-4">
                <FileText className="h-5 w-5 text-blue-600 mr-2" />
                <h2 className="text-lg font-medium text-gray-900">Upload Student List</h2>
              </div>
              <FileUpload
                accept=".csv"
                onFilesSelect={handleCSVUpload}
                uploadedFiles={csvFile ? [{ name: csvFile.name, size: csvFile.size }] : []}
                title="Upload CSV File"
                description="Upload a CSV file containing student email addresses"
              />
            </div>

            {/* Attachments Upload */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center mb-4">
                <Paperclip className="h-5 w-5 text-green-600 mr-2" />
                <h2 className="text-lg font-medium text-gray-900">Upload Attachments</h2>
              </div>
              <FileUpload
                multiple
                onFilesSelect={handleAttachmentUpload}
                uploadedFiles={attachments}
                onRemoveFile={handleRemoveAttachment}
                title="Upload Attachments"
                description="Upload files to be sent to all students (optional)"
              />
            </div>
          </div>

          {/* Right Column - Preview and Email Composer */}
          <div className="space-y-6">
            {/* Student Preview */}
            {students.length > 0 && (
              <StudentPreview students={students} totalCount={totalStudents} />
            )}

            {/* Email Composer */}
            <EmailComposer
              onSendEmails={handleSendEmails}
              isLoading={isLoading}
              canSend={students.length > 0}
            />
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-3">Setup Instructions</h3>
          <div className="text-sm text-blue-800 space-y-2">
            <p><strong>1. Server Setup:</strong> Run <code className="bg-blue-100 px-1 rounded">npm run server</code> to start the backend server on port 5000</p>
            <p><strong>2. Gmail Configuration:</strong> Gmail SMTP is already configured with your credentials</p>
            <p><strong>3. CSV Format:</strong> Ensure your CSV contains an 'email' column with valid email addresses</p>
            <p><strong>4. Server Status:</strong> Make sure the server is running before uploading files</p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;