'use client'

import { useState, useEffect, createContext, useContext } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, LogOut, Trash2, Edit, User, Calendar, Filter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

function apiFetch(path, options = {}) {
  return fetch(`${API_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
}

const AuthContext = createContext(null);

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { checkAuth(); }, []);

 const checkAuth = async () => {
  try {
    const response = await apiFetch('/api/auth/me');

    if (!response.ok) {
      // ❌ don’t treat as error
      setUser(null);
      return;
    }

    const data = await response.json();
    setUser(data.user);

  } catch (error) {
    console.error('Auth check error:', error);
    setUser(null);
  } finally {
    setLoading(false);
  }
};
  const login = async (email, password) => {
    const response = await apiFetch('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    if (!response.ok) { const error = await response.json(); throw new Error(error.error || 'Login failed'); }
    const data = await response.json(); setUser(data.user); return data;
  };

  const register = async (email, password, name) => {
    const response = await apiFetch('/api/auth/register', { method: 'POST', body: JSON.stringify({ email, password, name }) });
    if (!response.ok) { const error = await response.json(); throw new Error(error.error || 'Registration failed'); }
    const data = await response.json(); setUser(data.user); return data;
  };

  const logout = async () => { await apiFetch('/api/auth/logout', { method: 'POST' }); setUser(null); };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

function useAuth() { return useContext(AuthContext); }

function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
        toast({ title: 'Welcome back!', description: 'You have successfully logged in.' });
      } else {
        if (!name) { setError('Name is required'); setLoading(false); return; }
        await register(email, password, name);
        toast({ title: 'Account created!', description: 'Your account has been created successfully.' });
      }
    } catch (err) {
      setError(err.message);
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-3xl font-bold text-center">{isLogin ? 'Welcome Back' : 'Create Account'}</CardTitle>
          <CardDescription className="text-center">{isLogin ? 'Sign in to your account' : 'Sign up to get started'}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} required={!isLogin} />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="john@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Sign Up'}</Button>
          </form>
          <div className="mt-4 text-center text-sm">
            <button type="button" onClick={() => setIsLogin(!isLogin)} className="text-blue-600 hover:underline">
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function TaskCard({ task, onEdit, onDelete }) {
  const statusColors = { todo: 'bg-slate-100 text-slate-800 border-slate-300', 'in-progress': 'bg-blue-100 text-blue-800 border-blue-300', done: 'bg-green-100 text-green-800 border-green-300' };
  const statusLabels = { todo: 'To Do', 'in-progress': 'In Progress', done: 'Done' };

  return (
    <Card className="mb-3 hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-lg">{task.title}</h3>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={() => onEdit(task)} className="h-8 w-8 p-0"><Edit className="h-4 w-4" /></Button>
            <Button variant="ghost" size="sm" onClick={() => onDelete(task.id)} className="h-8 w-8 p-0 text-red-500 hover:text-red-700"><Trash2 className="h-4 w-4" /></Button>
          </div>
        </div>
        {task.description && <p className="text-sm text-muted-foreground mb-3">{task.description}</p>}
        <div className="flex flex-wrap gap-2 text-xs">
          <Badge className={statusColors[task.status]} variant="outline">{statusLabels[task.status]}</Badge>
          {task.dueDate && <Badge variant="outline" className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(task.dueDate).toLocaleDateString()}</Badge>}
          {task.assignedToUser && <Badge variant="outline" className="flex items-center gap-1"><User className="h-3 w-3" />{task.assignedToUser.name}</Badge>}
        </div>
      </CardContent>
    </Card>
  );
}

function TaskDialog({ task, open, onOpenChange, onSave, users }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'todo',
    dueDate: '',
    assignedTo: 'none', // ✅ FIXED
  });

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        status: task.status || 'todo',
        dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
        assignedTo: task.assignedTo || 'none', // ✅ FIXED
      });
    } else {
      setFormData({
        title: '',
        description: '',
        status: 'todo',
        dueDate: '',
        assignedTo: 'none', // ✅ FIXED
      });
    }
  }, [task, open]);

  const handleSubmit = (e) => {
    e.preventDefault();

    onSave({
      ...formData,
      assignedTo:
        formData.assignedTo === 'none' ? null : formData.assignedTo, // ✅ FIXED
      dueDate: formData.dueDate || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{task ? 'Edit Task' : 'Create New Task'}</DialogTitle>
          <DialogDescription>
            {task
              ? 'Update task details below'
              : 'Fill in the details to create a new task'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label>Title *</Label>
            <Input
              placeholder="Task title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              placeholder="Task description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
            />
          </div>

          {/* Status + Date */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input
                type="date"
                value={formData.dueDate}
                onChange={(e) =>
                  setFormData({ ...formData, dueDate: e.target.value })
                }
              />
            </div>
          </div>

          {/* Assign To */}
          <div className="space-y-2">
            <Label>Assign To</Label>
            <Select
              value={formData.assignedTo}
              onValueChange={(value) =>
                setFormData({ ...formData, assignedTo: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select team member" />
              </SelectTrigger>

              <SelectContent>
                {/* ✅ FIX: NO empty string */}
                <SelectItem value="none">Unassigned</SelectItem>

                {users?.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>

            <Button type="submit">
              {task ? 'Update Task' : 'Create Task'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Dashboard() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [assignedFilter, setAssignedFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  useEffect(() => { fetchTasks(); fetchUsers(); }, []);

  const fetchTasks = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (searchTerm) params.append('search', searchTerm);
      if (assignedFilter !== 'all') params.append('assignedTo', assignedFilter);
      const response = await apiFetch(`/api/tasks?${params}`);
      if (response.ok) { const data = await response.json(); setTasks(data.tasks); }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to fetch tasks', variant: 'destructive' });
    } finally { setLoading(false); }
  };

  const fetchUsers = async () => {
    try {
      const response = await apiFetch('/api/users');
      if (response.ok) { const data = await response.json(); setUsers(data.users); }
    } catch (error) { console.error('Error fetching users:', error); }
  };

  useEffect(() => {
    const timer = setTimeout(() => fetchTasks(), 300);
    return () => clearTimeout(timer);
  }, [searchTerm, statusFilter, assignedFilter]);

  const handleCreateTask = async (taskData) => {
    try {
      const response = await apiFetch('/api/tasks', { method: 'POST', body: JSON.stringify(taskData) });
      if (response.ok) { toast({ title: 'Success', description: 'Task created successfully' }); setDialogOpen(false); fetchTasks(); }
      else { const error = await response.json(); throw new Error(error.error); }
    } catch (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); }
  };

  const handleUpdateTask = async (taskData) => {
    try {
      const response = await apiFetch(`/api/tasks/${editingTask.id}`, { method: 'PUT', body: JSON.stringify(taskData) });
      if (response.ok) { toast({ title: 'Success', description: 'Task updated successfully' }); setDialogOpen(false); setEditingTask(null); fetchTasks(); }
      else { const error = await response.json(); throw new Error(error.error); }
    } catch (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      const response = await apiFetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
      if (response.ok) { toast({ title: 'Success', description: 'Task deleted successfully' }); fetchTasks(); }
      else { const error = await response.json(); throw new Error(error.error); }
    } catch (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); }
  };

  const todoTasks = tasks.filter((t) => t.status === 'todo');
  const inProgressTasks = tasks.filter((t) => t.status === 'in-progress');
  const doneTasks = tasks.filter((t) => t.status === 'done');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Task Manager</h1>
              <p className="text-sm text-slate-600">Welcome, {user?.name}</p>
            </div>
            <Button variant="outline" onClick={logout}><LogOut className="h-4 w-4 mr-2" />Logout</Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex-1 flex flex-col md:flex-row gap-3 w-full">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input placeholder="Search tasks..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[180px]"><Filter className="h-4 w-4 mr-2" /><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
              <Select value={assignedFilter} onValueChange={setAssignedFilter}>
                <SelectTrigger className="w-full md:w-[200px]"><User className="h-4 w-4 mr-2" /><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Members</SelectItem>
                  {users?.map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => { setEditingTask(null); setDialogOpen(true); }} className="w-full md:w-auto"><Plus className="h-4 w-4 mr-2" />New Task</Button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12"><p className="text-slate-500">Loading tasks...</p></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { label: 'To Do', items: todoTasks },
              { label: 'In Progress', items: inProgressTasks },
              { label: 'Done', items: doneTasks },
            ].map(({ label, items }) => (
              <div key={label} className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-lg text-slate-900">{label}</h2>
                  <Badge variant="secondary">{items.length}</Badge>
                </div>
                <div className="space-y-3">
                  {items.length === 0
                    ? <p className="text-sm text-slate-400 text-center py-8">No tasks</p>
                    : items.map((task) => <TaskCard key={task.id} task={task} onEdit={(t) => { setEditingTask(t); setDialogOpen(true); }} onDelete={handleDeleteTask} />)
                  }
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <TaskDialog task={editingTask} open={dialogOpen} onOpenChange={setDialogOpen} onSave={editingTask ? handleUpdateTask : handleCreateTask} users={users} />
    </div>
  );
}

function App() {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><p className="text-lg text-slate-600">Loading...</p></div>;
  return <>{user ? <Dashboard /> : <AuthForm />}<Toaster /></>;
}

export default function Home() {
  return <AuthProvider><App /></AuthProvider>;
}
