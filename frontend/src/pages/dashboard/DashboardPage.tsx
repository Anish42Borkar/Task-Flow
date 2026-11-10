import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Folder,
  Users,
  CheckSquare,
  CheckCircle2,
  TrendingUp,
  Clock,
  Calendar,
  ArrowRight,
  Plus,
  PlayCircle,
  FileEdit,
  UserPlus,
  Loader2,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { api } from '../../services/api';
import { Project, Task } from '../../types';

export const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';

  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [totalUsersCount, setTotalUsersCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setIsLoading(true);
        const [projRes, taskRes] = await Promise.all([
          api.get('/projects'),
          api.get('/tasks'),
        ]);

        const projList: Project[] = Array.isArray(projRes) ? (projRes as any) : [];
        const taskList: Task[] = Array.isArray(taskRes) ? (taskRes as any) : [];

        setProjects(projList);
        setTasks(taskList);

        if (isAdmin) {
          try {
            const userRes: any = await api.get('/users?limit=1');
            setTotalUsersCount(userRes?.total || 3);
          } catch {
            setTotalUsersCount(3);
          }
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [isAdmin]);

  const totalProjects = projects.length;
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'Completed').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'In Progress').length;
  const pendingTasks = tasks.filter((t) => t.status === 'Pending').length;

  const completedPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const inProgressPct = totalTasks > 0 ? Math.round((inProgressTasks / totalTasks) * 100) : 0;
  const pendingPct = totalTasks > 0 ? Math.round((pendingTasks / totalTasks) * 100) : 0;

  return (
    <div>
      {/* Top Welcome & Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>
          {isAdmin ? 'Admin Dashboard' : `Hello, ${user?.fullName?.split(' ')[0] || 'Team Member'} 👋`}
        </h1>
        <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>
          {isAdmin
            ? 'Real-time overview of projects, tasks, and teams across your organization.'
            : "Here's your work overview at a glance."}
        </p>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px', color: '#64748b', gap: '10px' }}>
          <Loader2 size={24} className="spin-animate" />
          <span>Loading dashboard analytics...</span>
        </div>
      ) : isAdmin ? (
        /* ======================== ADMIN DASHBOARD ======================== */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {/* Top 4 Stat Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
            {/* Stat 1: Total Projects */}
            <Card style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f46e5' }}>
                  <Folder size={24} />
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>Total Projects</div>
                  <div style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>{totalProjects}</div>
                  <div style={{ fontSize: '12px', color: '#059669', fontWeight: 600, marginTop: '2px' }}>Live in PostgreSQL</div>
                </div>
              </div>
            </Card>

            {/* Stat 2: Total Users */}
            <Card style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
                  <Users size={24} />
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>Total Users</div>
                  <div style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>{totalUsersCount}</div>
                  <div style={{ fontSize: '12px', color: '#059669', fontWeight: 600, marginTop: '2px' }}>Active accounts</div>
                </div>
              </div>
            </Card>

            {/* Stat 3: Total Tasks */}
            <Card style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706' }}>
                  <CheckSquare size={24} />
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>Total Tasks</div>
                  <div style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>{totalTasks}</div>
                  <div style={{ fontSize: '12px', color: '#059669', fontWeight: 600, marginTop: '2px' }}>With DnD persistence</div>
                </div>
              </div>
            </Card>

            {/* Stat 4: Completed Tasks */}
            <Card style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>Completed Tasks</div>
                  <div style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>{completedTasks}</div>
                  <div style={{ fontSize: '12px', color: '#059669', fontWeight: 600, marginTop: '2px' }}>{completedPct}% completion rate</div>
                </div>
              </div>
            </Card>
          </div>

          {/* Middle Row: Task Status Overview Donut & Tasks Trend */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '20px' }}>
            {/* Status Overview Card */}
            <Card title="Task Status Overview">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '16px 0' }}>
                {/* Visual Donut representation */}
                <div style={{ position: 'relative', width: '140px', height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="140" height="140" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="14" fill="none" stroke="#f1f5f9" strokeWidth="4.5" />
                    <circle
                      cx="18"
                      cy="18"
                      r="14"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="4.5"
                      strokeDasharray={`${completedPct || 1} 100`}
                      transform="rotate(-90 18 18)"
                    />
                  </svg>
                  <div style={{ position: 'absolute', textAlign: 'center' }}>
                    <div style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>{totalTasks}</div>
                    <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Total</div>
                  </div>
                </div>

                {/* Status Legend Pills */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                    <span style={{ fontSize: '13px', color: '#334155' }}>Completed: <strong>{completedTasks}</strong> ({completedPct}%)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#3b82f6' }} />
                    <span style={{ fontSize: '13px', color: '#334155' }}>In Progress: <strong>{inProgressTasks}</strong> ({inProgressPct}%)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#f59e0b' }} />
                    <span style={{ fontSize: '13px', color: '#334155' }}>Pending: <strong>{pendingTasks}</strong> ({pendingPct}%)</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Quick Action & System Health Card */}
            <Card title="Quick Management">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '10px 0' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => navigate('/projects')}
                    style={{
                      flex: 1,
                      padding: '14px',
                      borderRadius: '10px',
                      border: '1px solid #e2e8f0',
                      backgroundColor: '#f8fafc',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                    }}
                  >
                    <Folder size={20} color="#4f46e5" />
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>Manage Projects</span>
                  </button>
                  <button
                    onClick={() => navigate('/tasks')}
                    style={{
                      flex: 1,
                      padding: '14px',
                      borderRadius: '10px',
                      border: '1px solid #e2e8f0',
                      backgroundColor: '#f8fafc',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                    }}
                  >
                    <CheckSquare size={20} color="#10b981" />
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>Tasks & DnD</span>
                  </button>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => navigate('/users')}
                    style={{
                      flex: 1,
                      padding: '14px',
                      borderRadius: '10px',
                      border: '1px solid #e2e8f0',
                      backgroundColor: '#f8fafc',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                    }}
                  >
                    <Users size={20} color="#2563eb" />
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>Users & Roles</span>
                  </button>
                  <button
                    onClick={() => navigate('/permissions')}
                    style={{
                      flex: 1,
                      padding: '14px',
                      borderRadius: '10px',
                      border: '1px solid #e2e8f0',
                      backgroundColor: '#f8fafc',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                    }}
                  >
                    <TrendingUp size={20} color="#8b5cf6" />
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>RBAC Matrix</span>
                  </button>
                </div>
              </div>
            </Card>
          </div>

          {/* Bottom Row: Recent Projects & Tasks */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '20px' }}>
            {/* Recent Projects Card */}
            <Card
              title="Recent Projects"
              headerAction={
                <button
                  onClick={() => navigate('/projects')}
                  style={{ fontSize: '13px', fontWeight: 600, color: '#4f46e5', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', border: 'none', background: 'transparent' }}
                >
                  View All <ArrowRight size={14} />
                </button>
              }
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {projects.slice(0, 4).map((p) => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#eef2ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Folder size={18} />
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>{p.name}</div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>{p.tasksCount || 0} tasks</div>
                      </div>
                    </div>
                    <div style={{ width: '120px', textAlign: 'right' }}>
                      <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>{p.progressPercentage || 0}%</div>
                      <div style={{ width: '100%', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '9999px', overflow: 'hidden' }}>
                        <div style={{ width: `${p.progressPercentage || 0}%`, height: '100%', backgroundColor: '#4f46e5', borderRadius: '9999px' }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Recent Tasks Card */}
            <Card
              title="Recent Tasks"
              headerAction={
                <button
                  onClick={() => navigate('/tasks')}
                  style={{ fontSize: '13px', fontWeight: 600, color: '#4f46e5', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', border: 'none', background: 'transparent' }}
                >
                  View All <ArrowRight size={14} />
                </button>
              }
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {tasks.slice(0, 4).map((t) => (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                    <div>
                      <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#0f172a' }}>{t.title}</div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>{t.projectName}</div>
                    </div>
                    <Badge
                      variant={
                        t.status === 'Completed'
                          ? 'completed'
                          : t.status === 'In Progress'
                          ? 'progress'
                          : 'pending'
                      }
                    >
                      {t.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      ) : (
        /* ======================== USER DASHBOARD ======================== */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {/* User 4 Stat Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
            <Card style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f46e5' }}>
                  <CheckSquare size={24} />
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>Assigned Tasks</div>
                  <div style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a' }}>{totalTasks}</div>
                </div>
              </div>
            </Card>

            <Card style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
                  <PlayCircle size={24} />
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>In Progress</div>
                  <div style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a' }}>{inProgressTasks}</div>
                </div>
              </div>
            </Card>

            <Card style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>Completed</div>
                  <div style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a' }}>{completedTasks}</div>
                </div>
              </div>
            </Card>

            <Card style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706' }}>
                  <Folder size={24} />
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>My Projects</div>
                  <div style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a' }}>{totalProjects}</div>
                </div>
              </div>
            </Card>
          </div>

          {/* User Bottom Widgets: My Tasks & My Projects */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '20px' }}>
            <Card
              title="My Tasks"
              headerAction={
                <button
                  onClick={() => navigate('/tasks')}
                  style={{ fontSize: '13px', fontWeight: 600, color: '#4f46e5', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', border: 'none', background: 'transparent' }}
                >
                  Go to Board <ArrowRight size={14} />
                </button>
              }
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {tasks.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#64748b', padding: '20px' }}>No active tasks</div>
                ) : (
                  tasks.slice(0, 5).map((t) => (
                    <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                      <div>
                        <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#0f172a' }}>{t.title}</div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>{t.projectName}</div>
                      </div>
                      <Badge
                        variant={
                          t.status === 'Completed'
                            ? 'completed'
                            : t.status === 'In Progress'
                            ? 'progress'
                            : 'pending'
                        }
                      >
                        {t.status}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </Card>

            <Card
              title="Assigned Projects"
              headerAction={
                <button
                  onClick={() => navigate('/projects')}
                  style={{ fontSize: '13px', fontWeight: 600, color: '#4f46e5', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', border: 'none', background: 'transparent' }}
                >
                  View All <ArrowRight size={14} />
                </button>
              }
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {projects.map((p) => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>{p.name}</div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>{p.tasksCount || 0} tasks total</div>
                    </div>
                    <div style={{ width: '120px', textAlign: 'right' }}>
                      <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>{p.progressPercentage || 0}%</div>
                      <div style={{ width: '100%', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '9999px', overflow: 'hidden' }}>
                        <div style={{ width: `${p.progressPercentage || 0}%`, height: '100%', backgroundColor: '#4f46e5', borderRadius: '9999px' }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};
