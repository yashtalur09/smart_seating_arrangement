import React from 'react';
import { CheckCircle, AlertCircle, XCircle, Info } from 'lucide-react';

interface StatusMessageProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  details?: string[];
}

export const StatusMessage: React.FC<StatusMessageProps> = ({ type, message, details }) => {
  const config = {
    success: {
      icon: CheckCircle,
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-800',
      iconColor: 'text-green-500'
    },
    error: {
      icon: XCircle,
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-800',
      iconColor: 'text-red-500'
    },
    warning: {
      icon: AlertCircle,
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      textColor: 'text-yellow-800',
      iconColor: 'text-yellow-500'
    },
    info: {
      icon: Info,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-800',
      iconColor: 'text-blue-500'
    }
  };

  const { icon: Icon, bgColor, borderColor, textColor, iconColor } = config[type];

  return (
    <div className={`p-4 rounded-md border ${bgColor} ${borderColor}`}>
      <div className="flex items-start">
        <Icon className={`h-5 w-5 ${iconColor} mr-3 mt-0.5`} />
        <div className="flex-1">
          <p className={`text-sm font-medium ${textColor}`}>{message}</p>
          {details && details.length > 0 && (
            <div className={`mt-2 text-sm ${textColor}`}>
              <ul className="list-disc list-inside space-y-1">
                {details.map((detail, index) => (
                  <li key={index}>{detail}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};