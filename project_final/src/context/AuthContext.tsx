import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role: string, rollNumber?: string) => Promise<boolean>;
  register: (userData: RegisterData) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'faculty' | 'student';
  rollNumber?: string;
  department?: string;
  year?: number;
  section?: string;
}

interface StoredUser extends User {
  password: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Database simulation using localStorage
const DB_KEY = 'examhub_users_db';
const PASSWORDS_KEY = 'examhub_passwords_db';

const initializeDatabase = (): StoredUser[] => {
  const stored = localStorage.getItem(DB_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  
  // Initialize with default users if no database exists
  const defaultUsers: StoredUser[] = [
    {
      id: '1',
      name: 'Admin User',
      email: 'admin@university.edu',
      role: 'admin',
      password: 'admin123'
    },
    {
      id: '2',
      name: 'Dr. Sarah Johnson',
      email: 'sarah.johnson@university.edu',
      role: 'faculty',
      department: 'Computer Science',
      password: 'faculty123'
    },
    {
      id: '3',
      name: 'John Smith',
      email: 'john.smith@student.university.edu',
      role: 'student',
      rollNumber: 'CS2021001',
      department: 'Computer Science',
      year: 3,
      section: 'A',
      password: 'student123'
    },
    {
      id: '4',
      name: 'Alice Johnson',
      email: 'alice.johnson@student.university.edu',
      role: 'student',
      rollNumber: 'CS2022001',
      department: 'Computer Science',
      year: 2,
      section: 'B',
      password: 'student123'
    }
  ];
  
  localStorage.setItem(DB_KEY, JSON.stringify(defaultUsers));
  return defaultUsers;
};

const getDatabase = (): StoredUser[] => {
  const stored = localStorage.getItem(DB_KEY);
  return stored ? JSON.parse(stored) : [];
};

const saveToDatabase = (users: StoredUser[]) => {
  localStorage.setItem(DB_KEY, JSON.stringify(users));
};

const findUserByEmail = (email: string): StoredUser | undefined => {
  const users = getDatabase();
  return users.find(user => user.email.toLowerCase() === email.toLowerCase());
};

const findUserByRollNumber = (rollNumber: string): StoredUser | undefined => {
  const users = getDatabase();
  return users.find(user => user.role === 'student' && user.rollNumber === rollNumber);
};

const addUserToDatabase = (userData: RegisterData): StoredUser => {
  const users = getDatabase();
  const newUser: StoredUser = {
    id: Date.now().toString(),
    name: userData.name,
    email: userData.email,
    role: userData.role,
    password: userData.password,
    ...(userData.rollNumber && { rollNumber: userData.rollNumber }),
    ...(userData.department && { department: userData.department }),
    ...(userData.year && { year: userData.year }),
    ...(userData.section && { section: userData.section })
  };
  
  users.push(newUser);
  saveToDatabase(users);
  return newUser;
};

const authenticateUser = (email: string, password: string, role: string, rollNumber?: string): StoredUser | null => {
  const foundUser = findUserByEmail(email);
  
  // Check if user exists
  if (!foundUser) {
    return null;
  }
  
  // Check if role matches
  if (foundUser.role !== role) {
    return null;
  }
  
  // Check password
  if (foundUser.password !== password) {
    return null;
  }
  
  // For students, also check roll number
  if (role === 'student' && rollNumber) {
    if (foundUser.rollNumber !== rollNumber) {
      return null;
    }
  }
  
  return foundUser;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize database on first load
    initializeDatabase();
    
    // Check for stored auth on mount
    const storedUser = localStorage.getItem('exam_system_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const register = async (userData: RegisterData): Promise<boolean> => {
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    try {
      // Check if user already exists by email
      const existingUser = findUserByEmail(userData.email);
      if (existingUser) {
        setIsLoading(false);
        return false; // User already exists
      }
      
      // Check if roll number already exists for students
      if (userData.role === 'student' && userData.rollNumber) {
        const existingRollNumber = findUserByRollNumber(userData.rollNumber);
        if (existingRollNumber) {
          setIsLoading(false);
          return false; // Roll number already exists
        }
      }
      
      // Add user to database
      addUserToDatabase(userData);
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      setIsLoading(false);
      return false;
    }
  };

  const login = async (email: string, password: string, role: string, rollNumber?: string): Promise<boolean> => {
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    try {
      const authenticatedUser = authenticateUser(email, password, role, rollNumber);
      
      if (!authenticatedUser) {
        setIsLoading(false);
        return false;
      }
      
      // Remove password from user object before storing
      const { password: _, ...userWithoutPassword } = authenticatedUser;
      
      setUser(userWithoutPassword);
      localStorage.setItem('exam_system_user', JSON.stringify(userWithoutPassword));
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      setIsLoading(false);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('exam_system_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};