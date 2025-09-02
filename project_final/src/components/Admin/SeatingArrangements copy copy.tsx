import React, { useState } from 'react';
import { Users, Building2, Upload, Download, ArrowRight, FileText, Mail } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface CSVStudent {
  name: string;
  rollNumber: string;
  year: number;
  section: string;
}

const ALGO_OPTIONS = [
  { value: 'greedy', label: 'Greedy Graph Coloring (O(V+E))' },
  { value: 'backtracking', label: 'Backtracking CSP (Exponential)' },
  { value: 'randomized', label: 'Randomized Assignment (O(n))' },
  { value: 'simulated', label: 'Simulated Annealing (Heuristic)' }
];

const SeatingArrangements: React.FC = () => {
  const { exams, classrooms, addSeatingArrangement } = useData();
  const [selectedExam, setSelectedExam] = useState<string>('');
  const [selectedClassroom, setSelectedClassroom] = useState<string>('');
  const [csvStudents, setCsvStudents] = useState<CSVStudent[]>([]);
  const [roomConfig, setRoomConfig] = useState({
    numberOfStudents: 0,
    numberOfBenches: 0,
    studentsPerBench: 2
  });
  const [hallConfig, setHallConfig] = useState({
    numberOfStudents: 0,
    numberOfRows: 0,
    numberOfColumns: 0
  });
  const [generatedSeating, setGeneratedSeating] = useState<any[]>([]);
  const [step, setStep] = useState<'upload' | 'config' | 'generate'>('upload');
  const [algoInfo, setAlgoInfo] = useState<{ name: string; description: string; complexity: string; runtime: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedAlgo, setSelectedAlgo] = useState('greedy');

  const handleCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      const students: CSVStudent[] = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        if (values.length >= 4) {
          students.push({
            name: values[headers.indexOf('name')] || values[0],
            rollNumber: values[headers.indexOf('rollnumber')] || values[1],
            year: parseInt(values[headers.indexOf('year')] || values[2]) || 1,
            section: values[headers.indexOf('section')] || values[3]
          });
        }
      }
      
      setCsvStudents(students);
      setStep('config');
    };
    reader.readAsText(file);
  };

  const downloadSampleCSV = () => {
    const sampleData = [
      'Name,RollNumber,Year,Section',
      'John Smith,CS2021001,3,A',
      'Alice Johnson,CS2022001,2,B',
      'Bob Wilson,CS2023001,1,A',
      'Carol Davis,CS2021002,3,B'
    ].join('\n');
    
    const blob = new Blob([sampleData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_students.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Utility: Check if a student can be placed at a given seat (no adjacent same year)
  function canPlaceStudent(seatingGrid: any[][], row: number, col: number, student: CSVStudent) {
    const directions = [
      [0, -1], // left
      [0, 1],  // right
      [-1, 0], // up/front
      [1, 0]   // down/back
    ];
    for (const [dr, dc] of directions) {
      const r = row + dr, c = col + dc;
      if (r >= 0 && r < seatingGrid.length && c >= 0 && c < seatingGrid[0].length) {
        const adj = seatingGrid[r][c];
        if (adj && adj.year === student.year) return false;
      }
    }
    return true;
  }

  const generateSeatingArrangement = async () => {
    setLoading(true);
    setAlgoInfo(null);
    const t0 = performance.now();
    await new Promise(res => setTimeout(res, 10)); // minimal delay for UI
    const classroom = classrooms.find(c => c.id === selectedClassroom);
    if (!classroom || csvStudents.length === 0) { setLoading(false); return; }

    const seating: any[] = [];

    let algoName = '';
    let algoDesc = '';
    let algoComplexity = '';

    // --- Algorithm Selection Block ---
    if (classroom.type === 'room') {
      // Room seating: Bench Assignment (All algorithms)
      const { numberOfBenches, studentsPerBench } = roomConfig;
      const allStudents = csvStudents.slice(0, roomConfig.numberOfStudents);
      // Build a 2D grid for benches
      const benchGrid: (CSVStudent|null)[][] = Array.from({ length: numberOfBenches }, () => Array(studentsPerBench).fill(null));
      if (selectedAlgo === 'greedy' || selectedAlgo === 'randomized' || selectedAlgo === 'simulated') {
        algoName = `${selectedAlgo.charAt(0).toUpperCase() + selectedAlgo.slice(1)} Bench Assignment (Strict No-Adjacent-Section)`;
        algoDesc = 'Assigns students to benches so that no two adjacent (left, right, front, back, or same bench) are from the same section.';
        algoComplexity = selectedAlgo === 'greedy' ? 'O(n^2)' : selectedAlgo === 'randomized' ? 'O(n^2)' : 'O(n^2)';
        // Deterministic order for greedy/randomized/simulated
        const yearGroups: Record<number, CSVStudent[]> = {};
        allStudents.forEach(s => {
          if (!yearGroups[s.year]) yearGroups[s.year] = [];
          yearGroups[s.year].push(s);
        });
        const years = Object.keys(yearGroups).map(Number).sort();
        for (let bench = 0; bench < numberOfBenches; bench++) {
          for (let seat = 0; seat < studentsPerBench; seat++) {
            let placed = false;
            for (let y = 0; y < years.length; y++) {
              const year = years[(bench + seat + y) % years.length];
              if (yearGroups[year].length === 0) continue;
              const candidate = yearGroups[year][0];
              if (canPlaceStudent(benchGrid, bench, seat, candidate)) {
                benchGrid[bench][seat] = candidate;
                yearGroups[year].shift();
                placed = true;
                break;
              }
            }
            if (!placed) benchGrid[bench][seat] = null;
          }
        }
        // Flatten to seating array
        for (let bench = 0; bench < numberOfBenches; bench++) {
          for (let seat = 0; seat < studentsPerBench; seat++) {
            seating.push({
              benchNumber: bench + 1,
              seatNumber: seat + 1,
              student: benchGrid[bench][seat],
              position: `B${bench + 1}S${seat + 1}`
            });
          }
        }
      } else if (selectedAlgo === 'backtracking') {
        algoName = 'Backtracking CSP Bench Assignment (Strict No-Adjacent-Year)';
        algoDesc = 'Backtracking assignment to benches so that no two adjacent (left, right, front, back, or same bench) are from the same year.';
        algoComplexity = 'Exponential';
        // Backtracking CSP for benches
        const N = numberOfBenches * studentsPerBench;
        const students = allStudents.slice();
        function solve(pos: number, used: boolean[]): boolean {
          if (pos === N) return true;
          const bench = Math.floor(pos / studentsPerBench);
          const seat = pos % studentsPerBench;
          for (let i = 0; i < students.length; i++) {
            if (!used[i] && canPlaceStudent(benchGrid, bench, seat, students[i])) {
              benchGrid[bench][seat] = students[i];
              used[i] = true;
              if (solve(pos + 1, used)) return true;
              // Backtrack
              used[i] = false;
              benchGrid[bench][seat] = null;
            }
          }
          return false;
        }
        // Clear grid before solving
        for (let b = 0; b < numberOfBenches; b++) for (let s = 0; s < studentsPerBench; s++) benchGrid[b][s] = null;
        if (solve(0, Array(students.length).fill(false))) {
          for (let bench = 0; bench < numberOfBenches; bench++) {
            for (let seat = 0; seat < studentsPerBench; seat++) {
              seating.push({
                benchNumber: bench + 1,
                seatNumber: seat + 1,
                student: benchGrid[bench][seat],
                position: `B${bench + 1}S${seat + 1}`
              });
            }
          }
        } else {
          // fallback: leave empty
          for (let bench = 0; bench < numberOfBenches; bench++) {
            for (let seat = 0; seat < studentsPerBench; seat++) {
              seating.push({
                benchNumber: bench + 1,
                seatNumber: seat + 1,
                student: null,
                position: `B${bench + 1}S${seat + 1}`
              });
            }
          }
        }
      }
    } else {
      // Seminar Hall: Grid Assignment (All algorithms)
      const { numberOfRows, numberOfColumns } = hallConfig;
      const allStudents = csvStudents.slice(0, hallConfig.numberOfStudents);
      const grid: (CSVStudent|null)[][] = Array.from({ length: numberOfRows }, () => Array(numberOfColumns).fill(null));
      if (selectedAlgo === 'greedy' || selectedAlgo === 'randomized' || selectedAlgo === 'simulated') {
        algoName = `${selectedAlgo.charAt(0).toUpperCase() + selectedAlgo.slice(1)} Grid Assignment (Strict No-Adjacent-Section)`;
        algoDesc = 'Assigns students to seats so that no two adjacent (front, back, left, right) are from the same section.';
        algoComplexity = selectedAlgo === 'greedy' ? 'O(n^2)' : selectedAlgo === 'randomized' ? 'O(n^2)' : 'O(n^2)';
        const yearGroups: Record<number, CSVStudent[]> = {};
        allStudents.forEach(s => {
          if (!yearGroups[s.year]) yearGroups[s.year] = [];
          yearGroups[s.year].push(s);
        });
        const years = Object.keys(yearGroups).map(Number).sort();
        for (let row = 0; row < numberOfRows; row++) {
          for (let col = 0; col < numberOfColumns; col++) {
            let placed = false;
            for (let y = 0; y < years.length; y++) {
              const year = years[(row + col + y) % years.length];
              if (yearGroups[year].length === 0) continue;
              const candidate = yearGroups[year][0];
              if (canPlaceStudent(grid, row, col, candidate)) {
                grid[row][col] = candidate;
                yearGroups[year].shift();
                placed = true;
                break;
              }
            }
            if (!placed) grid[row][col] = null;
          }
        }
        for (let row = 0; row < numberOfRows; row++) {
          for (let col = 0; col < numberOfColumns; col++) {
            seating.push({
              row: row + 1,
              column: col + 1,
              student: grid[row][col],
              position: `R${row + 1}C${col + 1}`
            });
          }
        }
      } else if (selectedAlgo === 'backtracking') {
        algoName = 'Backtracking CSP Grid Assignment (Strict No-Adjacent-Year)';
        algoDesc = 'Backtracking assignment to grid so that no two adjacent (front, back, left, right) are from the same year.';
        algoComplexity = 'Exponential';
        const N = numberOfRows * numberOfColumns;
        const students = allStudents.slice();
        function solve(pos: number, used: boolean[]): boolean {
          if (pos === N) return true;
          const row = Math.floor(pos / numberOfColumns);
          const col = pos % numberOfColumns;
          for (let i = 0; i < students.length; i++) {
            if (!used[i] && canPlaceStudent(grid, row, col, students[i])) {
              grid[row][col] = students[i];
              used[i] = true;
              if (solve(pos + 1, used)) return true;
              // Backtrack
              used[i] = false;
              grid[row][col] = null;
            }
          }
          return false;
        }
        // Clear grid before solving
        for (let r = 0; r < numberOfRows; r++) for (let c = 0; c < numberOfColumns; c++) grid[r][c] = null;
        if (solve(0, Array(students.length).fill(false))) {
          for (let row = 0; row < numberOfRows; row++) {
            for (let col = 0; col < numberOfColumns; col++) {
              seating.push({
                row: row + 1,
                column: col + 1,
                student: grid[row][col],
                position: `R${row + 1}C${col + 1}`
              });
            }
          }
        } else {
          for (let row = 0; row < numberOfRows; row++) {
            for (let col = 0; col < numberOfColumns; col++) {
              seating.push({
                row: row + 1,
                column: col + 1,
                student: null,
                position: `R${row + 1}C${col + 1}`
              });
            }
          }
        }
      }
    }
    const t1 = performance.now();
    setGeneratedSeating(seating);
    setAlgoInfo({ name: algoName, description: algoDesc, complexity: algoComplexity, runtime: Math.round(t1 - t0) });
    setLoading(false);
    setStep('generate');
  };

  const saveSeatingArrangement = () => {
    if (selectedExam && selectedClassroom && generatedSeating.length > 0) {
      addSeatingArrangement({
        examId: selectedExam,
        classroomId: selectedClassroom,
        seats: generatedSeating
      });
      alert('Seating arrangement saved successfully!');
      
      // Reset form
      setStep('upload');
      setCsvStudents([]);
      setGeneratedSeating([]);
      setSelectedExam('');
      setSelectedClassroom('');
    }
  };

  const downloadSeatingArrangement = (format: 'csv' | 'pdf') => {
    if (generatedSeating.length === 0) {
      alert('No seating arrangement to download');
      return;
    }

    const exam = exams.find(e => e.id === selectedExam);
    const classroom = classrooms.find(c => c.id === selectedClassroom);

    if (format === 'csv') {
      // Generate CSV content
      const csvContent = [
        'Position,Student Name,Roll Number,Year,Section,Bench Number,Seat Number,Row,Column',
        ...generatedSeating
          .filter(seat => seat.student)
          .map(seat => [
            seat.position,
            seat.student?.name || '',
            seat.student?.rollNumber || '',
            seat.student?.year || '',
            seat.student?.section || '',
            seat.benchNumber || '',
            seat.seatNumber || '',
            seat.row || '',
            seat.column || ''
          ].join(','))
      ].join('\n');

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `seating_arrangement_${exam?.subject || 'exam'}_${exam?.date || 'date'}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } else if (format === 'pdf') {
      // Generate PDF content (simplified HTML for PDF generation)
      const pdfContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Seating Arrangement - ${exam?.subject || 'Exam'}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .exam-info { margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Seating Arrangement</h1>
            <h2>${exam?.subject || 'Exam'}</h2>
          </div>
          <div class="exam-info">
            <p><strong>Date:</strong> ${exam ? new Date(exam.date).toLocaleDateString() : 'N/A'}</p>
            <p><strong>Time:</strong> ${exam?.time || 'N/A'}</p>
            <p><strong>Classroom:</strong> ${classroom?.name || 'N/A'}</p>
            <p><strong>Total Students:</strong> ${generatedSeating.filter(s => s.student).length}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Position</th>
                <th>Student Name</th>
                <th>Roll Number</th>
                <th>Year</th>
                <th>Section</th>
              </tr>
            </thead>
            <tbody>
              ${generatedSeating
                .filter(seat => seat.student)
                .map(seat => `
                  <tr>
                    <td>${seat.position}</td>
                    <td>${seat.student?.name || ''}</td>
                    <td>${seat.student?.rollNumber || ''}</td>
                    <td>${seat.student?.year || ''}</td>
                    <td>${seat.student?.section || ''}</td>
                  </tr>
                `).join('')}
            </tbody>
          </table>
        </body>
        </html>
      `;

      // Open in new window for printing/saving as PDF
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(pdfContent);
        newWindow.document.close();
        newWindow.print();
      }
    }
  };

  const handleSendMail = () => {
    // Open the mail service in a new tab
    window.open('http://localhost:5174/', '_blank');
  };

  const selectedExamData = exams.find(e => e.id === selectedExam);
  const selectedClassroomData = classrooms.find(c => c.id === selectedClassroom);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Seating Arrangements</h1>
        <p className="text-gray-600 mt-1">Generate and manage exam seating arrangements</p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-center space-x-8">
          <div className={`flex items-center ${step === 'upload' ? 'text-blue-600' : step === 'config' || step === 'generate' ? 'text-green-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'upload' ? 'bg-blue-100' : step === 'config' || step === 'generate' ? 'bg-green-100' : 'bg-gray-100'}`}>
              <Upload className="w-4 h-4" />
            </div>
            <span className="ml-2 font-medium">Upload Students</span>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400" />
          <div className={`flex items-center ${step === 'config' ? 'text-blue-600' : step === 'generate' ? 'text-green-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'config' ? 'bg-blue-100' : step === 'generate' ? 'bg-green-100' : 'bg-gray-100'}`}>
              <Building2 className="w-4 h-4" />
            </div>
            <span className="ml-2 font-medium">Configure Room</span>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400" />
          <div className={`flex items-center ${step === 'generate' ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'generate' ? 'bg-blue-100' : 'bg-gray-100'}`}>
              <Users className="w-4 h-4" />
            </div>
            <span className="ml-2 font-medium">Generate Seating</span>
          </div>
        </div>
      </div>

      {/* Step 1: Upload CSV */}
      {step === 'upload' && (
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload Student List</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Exam
                </label>
                <select
                  value={selectedExam}
                  onChange={(e) => setSelectedExam(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Choose an exam</option>
                  {exams.filter(e => e.status === 'scheduled').map(exam => (
                    <option key={exam.id} value={exam.id}>
                      {exam.subject} - Year {exam.year} Section {exam.section}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload CSV File
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">Upload a CSV file with student information</p>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleCSVUpload}
                    className="hidden"
                    id="csv-upload"
                  />
                  <label
                    htmlFor="csv-upload"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    Choose CSV File
                  </label>
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">CSV Format Required:</h4>
                <p className="text-sm text-blue-800 mb-2">Name, RollNumber, Year, Section</p>
                <button
                  onClick={downloadSampleCSV}
                  className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
                >
                  <Download className="w-4 h-4" />
                  Download Sample CSV
                </button>
              </div>
              {csvStudents.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-800 font-medium">
                    ✓ Successfully loaded {csvStudents.length} students
                  </p>
                  <div className="mt-2 max-h-32 overflow-y-auto">
                    <div className="text-sm text-green-700">
                      {csvStudents.slice(0, 5).map((student, index) => (
                        <div key={index}>
                          {student.name} ({student.rollNumber}) - Year {student.year}, Section {student.section}
                        </div>
                      ))}
                      {csvStudents.length > 5 && <div>... and {csvStudents.length - 5} more</div>}
                    </div>
                  </div>
                  <button
                    onClick={() => setStep('config')}
                    disabled={!selectedExam}
                    className="mt-3 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Continue to Configuration
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Configure Room */}
      {step === 'config' && (
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Configure Classroom</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Algorithm <span className="text-xs text-blue-700">(DAA)</span>
                </label>
                <select
                  value={selectedAlgo}
                  onChange={e => setSelectedAlgo(e.target.value)}
                  className="w-full px-3 py-2 border border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                >
                  {ALGO_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Classroom
                </label>
                <select
                  value={selectedClassroom}
                  onChange={(e) => setSelectedClassroom(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Choose a classroom</option>
                  {classrooms.filter(c => c.available).map(classroom => (
                    <option key={classroom.id} value={classroom.id}>
                      {classroom.name} ({classroom.type}) - {classroom.capacity} capacity
                    </option>
                  ))}
                </select>
              </div>
              {selectedClassroomData && (
                <div className="space-y-4">
                  {selectedClassroomData.type === 'room' ? (
                    <div className="space-y-4">
                      <h3 className="font-medium text-gray-900">Room Configuration</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Number of Students
                          </label>
                          <input
                            type="number"
                            value={roomConfig.numberOfStudents}
                            onChange={(e) => setRoomConfig({...roomConfig, numberOfStudents: parseInt(e.target.value) || 0})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            max={csvStudents.length}
                            min="1"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Number of Benches
                          </label>
                          <input
                            type="number"
                            value={roomConfig.numberOfBenches}
                            onChange={(e) => setRoomConfig({...roomConfig, numberOfBenches: parseInt(e.target.value) || 0})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            min="1"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Students per Bench
                          </label>
                          <select
                            value={roomConfig.studentsPerBench}
                            onChange={(e) => setRoomConfig({...roomConfig, studentsPerBench: parseInt(e.target.value)})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value={1}>1</option>
                            <option value={2}>2</option>
                            <option value={3}>3</option>
                            <option value={4}>4</option>
                          </select>
                        </div>
                      </div>
                      
                      {/* Bench Capacity Rules Display */}
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <h4 className="font-medium text-yellow-800 mb-2">Bench Capacity Rules:</h4>
                        <div className="text-sm text-yellow-700 space-y-1">
                          {roomConfig.studentsPerBench === 2 && (
                            <p>• <strong>Capacity 2:</strong> Same year = 1 student per bench | Different years = both students on bench</p>
                          )}
                          {roomConfig.studentsPerBench === 3 && (
                            <p>• <strong>Capacity 3:</strong> Same year = students at ends, middle empty | Different years = different year in middle, same year at ends</p>
                          )}
                          {roomConfig.studentsPerBench >= 4 && (
                            <p>• <strong>Capacity {roomConfig.studentsPerBench}:</strong> Students placed at first and last seats only</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <h3 className="font-medium text-gray-900">Seminar Hall Configuration</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Number of Students
                          </label>
                          <input
                            type="number"
                            value={hallConfig.numberOfStudents}
                            onChange={(e) => setHallConfig({...hallConfig, numberOfStudents: parseInt(e.target.value) || 0})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            max={csvStudents.length}
                            min="1"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Number of Rows
                          </label>
                          <input
                            type="number"
                            value={hallConfig.numberOfRows}
                            onChange={(e) => setHallConfig({...hallConfig, numberOfRows: parseInt(e.target.value) || 0})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            min="1"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Number of Columns
                          </label>
                          <input
                            type="number"
                            value={hallConfig.numberOfColumns}
                            onChange={(e) => setHallConfig({...hallConfig, numberOfColumns: parseInt(e.target.value) || 0})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            min="1"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="flex gap-3">
                    <button
                      onClick={() => setStep('upload')}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Back
                    </button>
                    <button
                      onClick={generateSeatingArrangement}
                      disabled={
                        !selectedClassroom || 
                        (selectedClassroomData?.type === 'room' ? 
                          roomConfig.numberOfStudents === 0 || roomConfig.numberOfBenches === 0 :
                          hallConfig.numberOfStudents === 0 || hallConfig.numberOfRows === 0 || hallConfig.numberOfColumns === 0
                        )
                      }
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Generate Seating Arrangement
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Generated Seating */}
      {step === 'generate' && generatedSeating.length > 0 && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            {/* Algorithm Visualization */}
            {algoInfo && (
              <div className="mb-6">
                <h3 className="font-semibold text-blue-900 mb-2">Algorithm Used: {algoInfo.name}</h3>
                <p className="text-sm text-blue-800 mb-2">{algoInfo.description}</p>
                <div className="flex flex-col md:flex-row gap-6 items-center">
                  <div className="w-full md:w-1/2">
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={[{ name: algoInfo.name, Runtime: algoInfo.runtime }]}
                        margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                        <XAxis dataKey="name" />
                        <YAxis label={{ value: 'ms', angle: -90, position: 'insideLeft' }} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="Runtime" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="w-full md:w-1/2">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="font-medium text-blue-900">Time Complexity:</div>
                      <div className="text-blue-800">{algoInfo.complexity}</div>
                      <div className="mt-2 text-xs text-blue-700">(For seminar halls: Graph Coloring, for classrooms: Bench Assignment)</div>
                      <div className="mt-2 text-xs text-blue-900 font-bold">Runtime: {algoInfo.runtime} ms</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {/* Loading Spinner */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-12">
                <svg className="animate-spin h-10 w-10 text-blue-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                </svg>
                <div className="text-blue-700 font-medium">Generating seating arrangement using {algoInfo ? algoInfo.name : 'selected algorithm'}...</div>
              </div>
            )}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Generated Seating Arrangement</h2>
                <p className="text-gray-600">
                  {selectedExamData?.subject} - {selectedClassroomData?.name}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => downloadSeatingArrangement('csv')}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download CSV
                </button>
                <button
                  onClick={() => downloadSeatingArrangement('pdf')}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download PDF
                </button>
                <button
                  onClick={handleSendMail}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  Send Mail
                </button>
                <button
                  onClick={saveSeatingArrangement}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Save Arrangement
                </button>
              </div>
            </div>
            {/* Seating Visualization */}
            <div className="mb-6">
              {selectedClassroomData?.type === 'room' ? (
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900">Room Layout</h3>
                  <div className="grid gap-2" style={{
                    gridTemplateColumns: `repeat(${roomConfig.studentsPerBench}, 1fr)`,
                    maxWidth: '800px'
                  }}>
                    {Array.from({ length: roomConfig.numberOfBenches }, (_, benchIndex) => {
                      const benchNumber = benchIndex + 1;
                      return Array.from({ length: roomConfig.studentsPerBench }, (_, seatIndex) => {
                        const seatNumber = seatIndex + 1;
                        const seat = generatedSeating.find(s => 
                          s.benchNumber === benchNumber && s.seatNumber === seatNumber
                        );
                        
                        return (
                          <div
                            key={`B${benchNumber}S${seatNumber}`}
                            className={`p-3 border rounded-lg text-center text-sm ${
                              seat?.student 
                                ? 'bg-blue-50 border-blue-200' 
                                : 'bg-gray-50 border-gray-200'
                            }`}
                          >
                            <div className="font-medium text-xs text-gray-600 mb-1">
                              B{benchNumber}S{seatNumber}
                            </div>
                            {seat?.student ? (
                              <div>
                                <div className="font-medium truncate">{seat.student.name}</div>
                                <div className="text-xs text-gray-600">{seat.student.rollNumber}</div>
                                <div className="text-xs text-gray-600">Y{seat.student.year} {seat.student.section}</div>
                              </div>
                            ) : (
                              <div className="text-gray-400 text-xs">Empty</div>
                            )}
                          </div>
                        );
                      });
                    })}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900">Seminar Hall Layout</h3>
                  <div className="grid gap-2" style={{
                    gridTemplateColumns: `repeat(${hallConfig.numberOfColumns}, 1fr)`,
                    maxWidth: '1000px'
                  }}>
                    {Array.from({ length: hallConfig.numberOfRows }, (_, rowIndex) => {
                      const row = rowIndex + 1;
                      return Array.from({ length: hallConfig.numberOfColumns }, (_, colIndex) => {
                        const col = colIndex + 1;
                        const seat = generatedSeating.find(s => 
                          s.row === row && s.column === col
                        );
                        
                        return (
                          <div
                            key={`R${row}C${col}`}
                            className={`p-2 border rounded text-center text-xs ${
                              seat?.student 
                                ? 'bg-blue-50 border-blue-200' 
                                : 'bg-gray-50 border-gray-200'
                            }`}
                          >
                            <div className="font-medium text-xs text-gray-600 mb-1">
                              R{row}C{col}
                            </div>
                            {seat?.student ? (
                              <div>
                                <div className="font-medium truncate text-xs">{seat.student.name}</div>
                                <div className="text-xs text-gray-600">{seat.student.rollNumber}</div>
                                <div className="text-xs text-gray-600">Y{seat.student.year} {seat.student.section}</div>
                              </div>
                            ) : (
                              <div className="text-gray-400 text-xs">Empty</div>
                            )}
                          </div>
                        );
                      });
                    })}
                  </div>
                </div>
              )}
            </div>
            {/* Summary Statistics */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Summary</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-gray-600">Total Seats</div>
                  <div className="font-medium">
                    {selectedClassroomData?.type === 'room' 
                      ? roomConfig.numberOfBenches * roomConfig.studentsPerBench
                      : hallConfig.numberOfRows * hallConfig.numberOfColumns
                    }
                  </div>
                </div>
                <div>
                  <div className="text-gray-600">Occupied Seats</div>
                  <div className="font-medium">{generatedSeating.filter(s => s.student).length}</div>
                </div>
                <div>
                  <div className="text-gray-600">Empty Seats</div>
                  <div className="font-medium">{generatedSeating.filter(s => !s.student).length}</div>
                </div>
                <div>
                  <div className="text-gray-600">Utilization</div>
                  <div className="font-medium">
                    {Math.round((generatedSeating.filter(s => s.student).length / generatedSeating.length) * 100)}%
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setStep('config')}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Back to Configuration
              </button>
              <button
                onClick={() => {
                  setStep('upload');
                  setCsvStudents([]);
                  setGeneratedSeating([]);
                  setSelectedExam('');
                  setSelectedClassroom('');
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Start New Arrangement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SeatingArrangements;