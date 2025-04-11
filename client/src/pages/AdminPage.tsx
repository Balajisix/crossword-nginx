import React, { useState, useMemo } from 'react';
import useSWR from 'swr';
import {
  Plus,
  Trash2,
  Edit,
  LogOut,
  Search,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Users,
  CalendarDays,
  HelpCircle
} from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const BASE_URL = "http://localhost:5000";
// const BASE_URL = "https://crossword-game-ca-backend.vercel.app";

// Interfaces for data types
interface Question {
  _id: string;
  type: string;
  number: number;
  clue: string;
  answer: string;
  row: number;
  col: number;
}

interface GameSession {
  sessionId: string;
  startTime: string;
  endTime?: string;
  status: string;
  currentPlayer?: {
    sroNumber: string;
  };
}

interface User {
  _id: string;
  name: string;
  sroNumber: string;
  phoneNumber: string;
  score: number;
}

// A simple fetcher that returns JSON or throws an error
const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) {
      throw new Error(`An error occurred while fetching ${url}`);
    }
    return res.json();
  });

const AdminPanel: React.FC = () => {
  // SWR hooks for fetching data with a 60-second refresh interval.
  const {
    data: questionsRes,
    error: questionsError,
    isLoading: questionsLoading,
    mutate: mutateQuestions
  } = useSWR(`${BASE_URL}/api/admin/questions`, fetcher, { refreshInterval: 60000 }); void(questionsError);
  
  const {
    data: sessionsRes,
    error: sessionsError,
    isLoading: sessionsLoading,
    mutate: mutateSessions
  } = useSWR(`${BASE_URL}/api/admin/sessions`, fetcher, { refreshInterval: 60000 }); void(sessionsError);
  void(mutateSessions);
  
  const {
    data: usersRes,
    error: usersError,
    isLoading: usersLoading,
    mutate: mutateUsers
  } = useSWR(`${BASE_URL}/api/admin/users`, fetcher, { refreshInterval: 60000 }); void(usersError);
  void(mutateUsers);

  // Derive arrays from responses
  const questions: Question[] = questionsRes?.questions || [];
  const sessions: GameSession[] = sessionsRes?.sessions || [];
  const activeSessions: any[] = sessionsRes?.activeSessions || [];
  const users: User[] = usersRes?.users || [];

  // Other local UI states
  const [activeTab, setActiveTab] = useState<'questions' | 'sessions' | 'users'>('questions');
  const [newQuestion, setNewQuestion] = useState({
    type: '',
    number: '',
    clue: '',
    answer: '',
    row: '',
    col: ''
  });
  const [error, setError] = useState<string>(''); void(error);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: '',
    direction: 'asc'
  });

  // Global loading state from SWR hooks.
  const isLoading = questionsLoading || sessionsLoading || usersLoading;

  // Dashboard stats using useMemo (recalculates when data changes)
  const dashboardStats = useMemo(() => {
    return {
      totalQuestions: questions.length,
      totalSessions: sessions.length,
      activeSessions: activeSessions.length,
      totalUsers: users.length,
      topScorer: users.length
        ? users.reduce((max, user) => (user.score > max.score ? user : max), users[0])
        : null
    };
  }, [questions, sessions, users, activeSessions]);

  // Filtering and Sorting Logic
  const filteredData = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    switch (activeTab) {
      case 'questions':
        return questions.filter(q =>
          q.clue.toLowerCase().includes(term) ||
          q.answer.toLowerCase().includes(term) ||
          q.type.toLowerCase().includes(term) ||
          q.number.toString().includes(term)
        );
      case 'sessions':
        return sessions.filter(s =>
          s.sessionId.toLowerCase().includes(term) ||
          s.status.toLowerCase().includes(term) ||
          new Date(s.startTime).toLocaleString().toLowerCase().includes(term) ||
          (s.currentPlayer && s.currentPlayer.sroNumber.toLowerCase().includes(term))
        );
      case 'users':
        return users.filter(u =>
          u.name.toLowerCase().includes(term) ||
          u.sroNumber.toLowerCase().includes(term) ||
          u.phoneNumber.toLowerCase().includes(term) ||
          u.score.toString().includes(term)
        );
      default:
        return [];
    }
  }, [activeTab, searchTerm, questions, sessions, users]);

  const sortedData = useMemo(() => {
    if (!sortConfig.key) return filteredData;
    return [...filteredData].sort((a: any, b: any) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [filteredData, sortConfig]);

  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setNewQuestion(prev => ({ ...prev, [name]: value }));
  };

  // Create Question
  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${BASE_URL}/api/admin/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: newQuestion.type,
          number: Number(newQuestion.number),
          clue: newQuestion.clue,
          answer: newQuestion.answer,
          row: Number(newQuestion.row),
          col: Number(newQuestion.col)
        })
      });
      if (!res.ok) throw new Error("Failed to create question");

      toast.success("Question created successfully!");
      // Revalidate questions endpoint
      mutateQuestions();
      setNewQuestion({ type: '', number: '', clue: '', answer: '', row: '', col: '' });
      setIsCreateModalOpen(false);
    } catch (err: any) {
      console.error("Create question error:", err);
      setError(err.message);
      toast.error(err.message || "Failed to create question");
    }
  };

  // Delete Question
  const handleDeleteQuestion = async (questionId: string) => {
    if (!window.confirm("Are you sure you want to delete this question?")) return;
    try {
      const res = await fetch(`${BASE_URL}/api/game/questions/${questionId}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error("Failed to delete question");

      toast.success("Question deleted successfully!");
      mutateQuestions();
    } catch (err: any) {
      console.error("Delete question error:", err);
      toast.error(err.message || "Failed to delete question");
      setError(err.message);
    }
  };

  // Edit Question Modal functions
  const openEditModal = (question: Question) => {
    setEditingQuestion(question);
    setIsEditModalOpen(true);
  };

  const handleEditQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuestion) return;
    try {
      const res = await fetch(`${BASE_URL}/api/game/questions/${editingQuestion._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: editingQuestion.type,
          number: editingQuestion.number,
          clue: editingQuestion.clue,
          answer: editingQuestion.answer,
          row: editingQuestion.row,
          col: editingQuestion.col
        })
      });
      if (!res.ok) throw new Error("Failed to update question");

      toast.success("Question updated successfully!");
      mutateQuestions();
      setIsEditModalOpen(false);
      setEditingQuestion(null);
    } catch (err: any) {
      console.error("Edit question error:", err);
      toast.error(err.message || "Failed to update question");
      setError(err.message);
    }
  };

  // Logout
  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      localStorage.removeItem('isAdmin');
      window.location.href = '/login';
    }
  };

  // Modal for creating a new question
  const renderCreateQuestionModal = () => (
    isCreateModalOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm transition-all duration-300">
        <div className="w-full max-w-lg p-8 bg-white rounded-xl shadow-xl transform transition-all duration-300">
          <h2 className="mb-6 text-2xl font-bold text-center text-gray-800">Create New Question</h2>
          <form onSubmit={handleCreateQuestion} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Type</label>
                <select
                  name="type"
                  value={newQuestion.type}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Type</option>
                  <option value="across">Across</option>
                  <option value="down">Down</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Number</label>
                <input
                  type="number"
                  name="number"
                  value={newQuestion.number}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Clue</label>
              <input
                type="text"
                name="clue"
                value={newQuestion.clue}
                onChange={handleInputChange}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Answer</label>
              <input
                type="text"
                name="answer"
                value={newQuestion.answer}
                onChange={handleInputChange}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Row</label>
                <input
                  type="number"
                  name="row"
                  value={newQuestion.row}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Col</label>
                <input
                  type="number"
                  name="col"
                  value={newQuestion.col}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
            <div className="flex justify-end gap-4 mt-6">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 transition"
              >
                Create Question
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  );

  // Modal for editing a question
  const renderEditQuestionModal = () => (
    isEditModalOpen && editingQuestion && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm transition-all duration-300">
        <div className="w-full max-w-lg p-8 bg-white rounded-xl shadow-xl transform transition-all duration-300">
          <h2 className="mb-6 text-2xl font-bold text-center text-gray-800">Edit Question</h2>
          <form onSubmit={handleEditQuestion} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Type</label>
                <select
                  name="type"
                  value={editingQuestion.type}
                  onChange={(e) =>
                    setEditingQuestion(prev => prev ? { ...prev, type: e.target.value } : null)
                  }
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Type</option>
                  <option value="across">Across</option>
                  <option value="down">Down</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Number</label>
                <input
                  type="number"
                  name="number"
                  value={editingQuestion.number}
                  onChange={(e) =>
                    setEditingQuestion(prev => prev ? { ...prev, number: Number(e.target.value) } : null)
                  }
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Clue</label>
              <input
                type="text"
                name="clue"
                value={editingQuestion.clue}
                onChange={(e) =>
                  setEditingQuestion(prev => prev ? { ...prev, clue: e.target.value } : null)
                }
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Answer</label>
              <input
                type="text"
                name="answer"
                value={editingQuestion.answer}
                onChange={(e) =>
                  setEditingQuestion(prev => prev ? { ...prev, answer: e.target.value } : null)
                }
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Row</label>
                <input
                  type="number"
                  name="row"
                  value={editingQuestion.row}
                  onChange={(e) =>
                    setEditingQuestion(prev => prev ? { ...prev, row: Number(e.target.value) } : null)
                  }
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Col</label>
                <input
                  type="number"
                  name="col"
                  value={editingQuestion.col}
                  onChange={(e) =>
                    setEditingQuestion(prev => prev ? { ...prev, col: Number(e.target.value) } : null)
                  }
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
            <div className="flex justify-end gap-4 mt-6">
              <button
                type="button"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingQuestion(null);
                }}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 transition"
              >
                Update Question
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  );

  // Render Table Headers with Sorting Icon
  const renderTableHeader = (headers: { key: string, label: string }[]) => (
    <thead className="bg-gradient-to-r from-blue-50 to-indigo-50 text-gray-700">
      <tr>
        {headers.map(header => (
          <th
            key={header.key}
            onClick={() => handleSort(header.key)}
            className="p-3 text-left cursor-pointer hover:bg-blue-100 select-none transition rounded-t"
          >
            <div className="flex items-center">
              <span>{header.label}</span>
              {sortConfig.key === header.key && (
                sortConfig.direction === 'asc'
                  ? <ChevronUp className="ml-2 h-4 w-4" />
                  : <ChevronDown className="ml-2 h-4 w-4" />
              )}
            </div>
          </th>
        ))}
      </tr>
    </thead>
  );

  // Function to handle report download
  const handleDownloadReport = () => {
    window.open(`${BASE_URL}/api/admin/report`, '_blank');
  };

  // Dashboard summary cards
  const renderDashboardSummary = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-xl shadow-lg text-white">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-medium opacity-80">Total Questions</h3>
            <p className="text-3xl font-bold mt-2">{dashboardStats.totalQuestions}</p>
          </div>
          <div className="bg-opacity-20 p-3 rounded-lg">
            <HelpCircle size={24} strokeWidth={2} className="text-white" />
          </div>
        </div>
      </div>
      <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-xl shadow-lg text-white">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-medium opacity-80">Game Sessions</h3>
            <p className="text-3xl font-bold mt-2">{dashboardStats.totalSessions}</p>
            <p className="text-sm mt-1 opacity-90 font-semibold text-white">{dashboardStats.activeSessions} active users are playing</p>
          </div>
          <div className="bg-opacity-20 p-3 rounded-lg">
            <CalendarDays size={24} strokeWidth={2} className="text-white" />
          </div>
        </div>
      </div>
      <div className="bg-gradient-to-r from-teal-500 to-teal-600 p-6 rounded-xl shadow-lg text-white">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-medium opacity-80">Total Users</h3>
            <p className="text-3xl font-bold mt-2">{dashboardStats.totalUsers}</p>
          </div>
          <div className="bg-opacity-20 p-3 rounded-lg">
            <Users size={24} strokeWidth={2} className="text-white" />
          </div>
        </div>
      </div>
      <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 p-6 rounded-xl shadow-lg text-white">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-medium opacity-80">Top Score</h3>
            <p className="text-3xl font-bold mt-2">
              {dashboardStats.topScorer ? dashboardStats.topScorer.score : 'N/A'}
            </p>
            <p className="text-sm mt-1 opacity-80">
              {dashboardStats.topScorer ? dashboardStats.topScorer.name : 'No data'}
            </p>
          </div>
          <div className="bg-opacity-20 p-3 rounded-lg">
            <BarChart3 size={24} strokeWidth={2} className="text-white" />
          </div>
        </div>
      </div>
    </div>
  );

  // Loading skeleton for data tables
  const renderLoadingSkeleton = () => (
    <div className="animate-pulse">
      <div className="h-12 bg-gray-200 rounded mb-4"></div>
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="grid grid-cols-4 gap-4">
            <div className="h-10 bg-gray-200 rounded col-span-1"></div>
            <div className="h-10 bg-gray-200 rounded col-span-1"></div>
            <div className="h-10 bg-gray-200 rounded col-span-1"></div>
            <div className="h-10 bg-gray-200 rounded col-span-1"></div>
          </div>
        ))}
      </div>
    </div>
  );

  // Empty state when no data found
  const renderEmptyState = () => (
    <div className="text-center py-16">
      <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <Search className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-800">No {activeTab} found</h3>
      <p className="text-gray-500 mt-2">
        {searchTerm 
          ? `No ${activeTab} matching "${searchTerm}"` 
          : `There are no ${activeTab} to display yet`}
      </p>
      {activeTab === 'questions' && (
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Add your first question
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
      {renderCreateQuestionModal()}
      {renderEditQuestionModal()}

      {/* Header */}
      <header className="bg-gradient-to-r from-blue-700 to-indigo-800 py-6 shadow-lg">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between px-4">
          <div className="flex items-center">
            <h1 className="text-3xl font-bold text-white">Crossword Puzzle Admin</h1>
          </div>
          <div className="flex items-center space-x-4 mt-4 md:mt-0">
            <button
              onClick={handleDownloadReport}
              className="px-4 py-2 bg-white text-indigo-800 rounded-lg hover:bg-gray-100 transition shadow-md"
            >
              <span className="hidden sm:inline">Download </span>Report
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center px-4 py-2 text-white bg-red-500 rounded-lg hover:bg-red-600 transition shadow-md"
            >
              <LogOut className="mr-0 sm:mr-2 h-5 w-5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Dashboard Summary */}
        {renderDashboardSummary()}

        {/* Tabs Navigation */}
        <div className="mb-6 border-b border-gray-200 bg-white rounded-xl shadow-md">
          <nav className="flex space-x-1 overflow-x-auto p-1">
            {['questions', 'sessions', 'users'].map(tab => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab as 'questions' | 'sessions' | 'users');
                  setSearchTerm('');
                }}
                className={`py-3 px-5 whitespace-nowrap font-medium transition rounded-lg flex-1 ${
                  activeTab === tab 
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                } capitalize`}
              >
                {tab === 'questions' && <HelpCircle className="inline mr-2 h-5 w-5" />}
                {tab === 'sessions' && <CalendarDays className="inline mr-2 h-5 w-5" />}
                {tab === 'users' && <Users className="inline mr-2 h-5 w-5" />}
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {/* Search & Action Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
          <div className="relative flex-grow">
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-3 pl-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
            />
            <Search className="absolute left-4 top-3 text-gray-400" />
          </div>
          {activeTab === 'questions' && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center justify-center px-6 py-3 text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition shadow-md"
            >
              <Plus className="mr-2 h-5 w-5" /> Add Question
            </button>
          )}
        </div>

        {/* Data Tables */}
        <div className="bg-white shadow-md rounded-xl overflow-hidden">
          {isLoading ? (
            <div className="p-6">
              {renderLoadingSkeleton()}
            </div>
          ) : sortedData.length === 0 ? (
            renderEmptyState()
          ) : (
            <div className="overflow-x-auto">
              {activeTab === 'questions' && (
                <table className="w-full min-w-[700px]">
                  {renderTableHeader([
                    { key: 'number', label: 'Number' },
                    { key: 'clue', label: 'Clue' },
                    { key: 'type', label: 'Type' },
                    { key: 'answer', label: 'Answer' },
                    { key: 'location', label: 'Location' },
                    { key: 'actions', label: 'Actions' }
                  ])}
                  <tbody>
                    {(sortedData as Question[]).map((q: Question, index: number) => (
                      <tr key={q._id} className={`border-b hover:bg-blue-50 transition ${index % 2 === 0 ? 'bg-gray-50' : ''}`}>
                        <td className="p-4 font-medium">{q.number}</td>
                        <td className="p-4">{q.clue}</td>
                        <td className="p-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${q.type === 'across' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                            {q.type}
                          </span>
                        </td>
                        <td className="p-4 font-mono">{q.answer}</td>
                        <td className="p-4">
                          <span className="px-2 py-1 bg-gray-100 rounded text-sm">
                            ({q.row}, {q.col})
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => openEditModal(q)}
                              className="p-2 text-blue-600 hover:bg-blue-100 rounded-full transition"
                              title="Edit"
                            >
                              <Edit className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleDeleteQuestion(q._id)}
                              className="p-2 text-red-600 hover:bg-red-100 rounded-full transition"
                              title="Delete"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {activeTab === 'sessions' && (
                <table className="w-full min-w-[700px]">
                  {renderTableHeader([
                    { key: 'sessionId', label: 'Session ID' },
                    { key: 'startTime', label: 'Start Time' },
                    { key: 'endTime', label: 'End Time' },
                    { key: 'status', label: 'Status' },
                    { key: 'currentPlayer', label: 'Current Player' }
                  ])}
                  <tbody>
                    {(sortedData as GameSession[]).map((session: GameSession, index: number) => (
                      <tr key={session.sessionId} className={`border-b hover:bg-blue-50 transition ${index % 2 === 0 ? 'bg-gray-50' : ''}`}>
                        <td className="p-4 font-mono text-sm">{session.sessionId}</td>
                        <td className="p-4">{new Date(session.startTime).toLocaleString()}</td>
                        <td className="p-4">{session.endTime ? new Date(session.endTime).toLocaleString() : '-'}</td>
                        <td className="p-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            session.status === 'active' ? 'bg-green-100 text-green-800' :
                            session.status === 'completed' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {session.status}
                          </span>
                        </td>
                        <td className="p-4">
                          {session.currentPlayer ? session.currentPlayer.sroNumber : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {activeTab === 'users' && (
                <table className="w-full min-w-[700px]">
                  {renderTableHeader([
                    { key: 'name', label: 'Name' },
                    { key: 'sroNumber', label: 'SRO Number' },
                    { key: 'phoneNumber', label: 'Phone' },
                    { key: 'score', label: 'Score' }
                  ])}
                  <tbody>
                    {(sortedData as User[]).map((user: User, index: number) => (
                      <tr key={user._id} className={`border-b hover:bg-blue-50 transition ${index % 2 === 0 ? 'bg-gray-50' : ''}`}>
                        <td className="p-4 font-medium">{user.name}</td>
                        <td className="p-4 font-mono">{user.sroNumber}</td>
                        <td className="p-4">{user.phoneNumber}</td>
                        <td className="p-4">
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {user.score} pts
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-100 border-t py-6 mt-8">
        <div className="container mx-auto px-4 text-center text-gray-500">
          <p>&copy; {new Date().getFullYear()} Crossword Puzzle Game. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default AdminPanel;
