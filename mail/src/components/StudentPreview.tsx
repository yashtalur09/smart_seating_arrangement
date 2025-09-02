import React from 'react';
import { Users, Mail } from 'lucide-react';

interface Student {
  email: string;
  name: string;
  [key: string]: any;
}

interface StudentPreviewProps {
  students: Student[];
  totalCount: number;
}

export const StudentPreview: React.FC<StudentPreviewProps> = ({ students, totalCount }) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center mb-4">
        <Users className="h-5 w-5 text-blue-600 mr-2" />
        <h3 className="text-lg font-medium text-gray-900">Student Preview</h3>
        <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
          {totalCount} students
        </span>
      </div>
      
      <div className="space-y-3">
        {students.map((student, index) => (
          <div key={index} className="flex items-center p-3 bg-gray-50 rounded-md">
            <Mail className="h-4 w-4 text-gray-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-900">{student.name}</p>
              <p className="text-sm text-gray-600">{student.email}</p>
            </div>
          </div>
        ))}
        
        {totalCount > students.length && (
          <div className="text-center p-3 text-sm text-gray-500 bg-gray-50 rounded-md">
            + {totalCount - students.length} more students
          </div>
        )}
      </div>
    </div>
  );
};