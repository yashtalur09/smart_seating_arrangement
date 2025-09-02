import React from 'react';
import { Users, FileText, Building2, MessageSquare, Calendar, Clock, TrendingUp } from 'lucide-react';
import OverviewCard from './OverviewCard';
import { useData } from '../../context/DataContext';

const AdminDashboard: React.FC = () => {
  const { exams, classrooms, complaints, leaveRequests, students } = useData();

  const upcomingExams = exams.filter(exam => exam.status === 'scheduled');
  const availableClassrooms = classrooms.filter(room => room.available);
  const pendingComplaints = complaints.filter(complaint => complaint.status === 'pending');
  const pendingLeaveRequests = leaveRequests.filter(request => request.status === 'pending');

  // Student distribution data
  const studentsBySection = students.reduce((acc, student) => {
    const key = `Year ${student.year} - Section ${student.section}`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-1">Overview of exam management system</p>
      </div>





      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Complaints */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Recent Complaints
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {complaints.slice(0, 3).map((complaint) => (
                <div key={complaint.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">{complaint.studentName}</h3>
                      <p className="text-sm text-gray-600">Roll: {complaint.studentRollNumber}</p>
                      <p className="text-sm text-gray-700 mt-1">{complaint.issue}</p>
                      <p className="text-xs text-gray-500 mt-1">By {complaint.facultyName}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      complaint.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      complaint.status === 'under_review' ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {complaint.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pending Leave Requests */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Pending Leave Requests
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {pendingLeaveRequests.map((request) => (
                <div key={request.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">{request.studentName}</h3>
                      <p className="text-sm text-gray-600">Roll: {request.studentRollNumber}</p>
                      <p className="text-sm text-gray-700 mt-1">Exam: {request.examSubject}</p>
                      <p className="text-sm text-gray-600 mt-1">{request.reason}</p>
                    </div>
                    <div className="flex gap-2">
                      <button className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700">
                        Approve
                      </button>
                      <button className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700">
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {pendingLeaveRequests.length === 0 && (
                <p className="text-gray-500 text-center py-4">No pending leave requests</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;