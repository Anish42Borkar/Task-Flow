import React from 'react';
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
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';

export const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const isAdmin = user?.role === 'admin';

  return (
    <div>
      {/* Top Welcome & Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>
          {isAdmin ? 'Admin Dashboard' : `Hello, ${user?.fullName?.split(' ')[0] || 'Team Member'} 👋`}
        </h1>
        <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>
          {isAdmin
            ? 'Manage projects, users and tasks across your organization'
            : "Here's your work at a glance."}
        </p>
      </div>

      {isAdmin ? (
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
                  <div style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>8</div>
                  <div style={{ fontSize: '12px', color: '#059669', fontWeight: 600, marginTop: '2px' }}>↑ +33% vs. last month</div>
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
                  <div style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>24</div>
                  <div style={{ fontSize: '12px', color: '#059669', fontWeight: 600, marginTop: '2px' }}>↑ +20% vs. last month</div>
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
                  <div style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>56</div>
                  <div style={{ fontSize: '12px', color: '#059669', fontWeight: 600, marginTop: '2px' }}>↑ +12% vs. last month</div>
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
                  <div style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>32</div>
                  <div style={{ fontSize: '12px', color: '#059669', fontWeight: 600, marginTop: '2px' }}>↑ +28% vs. last month</div>
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
                    {/* Completed 57% */}
                    <circle
                      cx="18"
                      cy="18"
                      r="14"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="4.5"
                      strokeDasharray="50 100"
                      strokeDashoffset="25"
                    />
                    {/* Pending 32% */}
                    <circle
                      cx="18"
                      cy="18"
                      r="14"
                      fill="none"
                      stroke="#4f46e5"
                      strokeWidth="4.5"
                      strokeDasharray="28 100"
                      strokeDashoffset="-25"
                    />
                    {/* In Progress 11% */}
                    <circle
                      cx="18"
                      cy="18"
                      r="14"
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="4.5"
                      strokeDasharray="10 100"
                      strokeDashoffset="-53"
                    />
                  </svg>
                  <div style={{ position: 'absolute', textAlign: 'center' }}>
                    <div style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>56</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>Total Tasks</div>
                  </div>
                </div>

                {/* Legend */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#4f46e5' }} />
                    <span style={{ fontSize: '13px', color: '#334155', width: '90px' }}>Pending</span>
                    <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a' }}>18</span>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>32%</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#38bdf8' }} />
                    <span style={{ fontSize: '13px', color: '#334155', width: '90px' }}>In Progress</span>
                    <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a' }}>6</span>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>11%</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                    <span style={{ fontSize: '13px', color: '#334155', width: '90px' }}>Completed</span>
                    <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a' }}>32</span>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>57%</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Tasks Trend Card */}
            <Card
              title="Tasks Trend"
              headerAction={
                <select style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12.5px', color: '#475569' }}>
                  <option>Last 30 Days</option>
                  <option>Last 7 Days</option>
                </select>
              }
            >
              <div style={{ height: '160px', display: 'flex', alignItems: 'flex-end', gap: '16px', padding: '16px 0' }}>
                <svg width="100%" height="140" viewBox="0 0 400 120" preserveAspectRatio="none">
                  <path
                    d="M 10 90 Q 70 75 120 85 T 230 45 T 320 30 T 390 15"
                    fill="none"
                    stroke="#4f46e5"
                    strokeWidth="3"
                  />
                  <path
                    d="M 10 90 Q 70 75 120 85 T 230 45 T 320 30 T 390 15 L 390 120 L 10 120 Z"
                    fill="rgba(79, 70, 229, 0.08)"
                  />
                  <circle cx="10" cy="90" r="4" fill="#4f46e5" />
                  <circle cx="120" cy="85" r="4" fill="#4f46e5" />
                  <circle cx="230" cy="45" r="4" fill="#4f46e5" />
                  <circle cx="320" cy="30" r="4" fill="#4f46e5" />
                  <circle cx="390" cy="15" r="4" fill="#4f46e5" />
                </svg>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8' }}>
                <span>Oct 8</span>
                <span>Oct 16</span>
                <span>Oct 24</span>
                <span>Nov 1</span>
                <span>Nov 5</span>
              </div>
            </Card>
          </div>

          {/* Bottom Row: Recent Projects & Recent Activity */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '20px' }}>
            {/* Recent Projects Card */}
            <Card
              title="Recent Projects"
              headerAction={
                <button
                  onClick={() => navigate('/projects')}
                  style={{ fontSize: '13px', fontWeight: 600, color: '#4f46e5', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  View All <ArrowRight size={14} />
                </button>
              }
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {[
                  { name: 'QuickChat', desc: 'Real-time chat application', tasks: 24, progress: 75, iconColor: '#8b5cf6' },
                  { name: 'Task Management', desc: 'Project and task tracking system', tasks: 18, progress: 60, iconColor: '#3b82f6' },
                  { name: 'Website Redesign', desc: 'Marketing website revamp', tasks: 14, progress: 43, iconColor: '#10b981' },
                ].map((p, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: `${p.iconColor}15`, color: p.iconColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Folder size={18} />
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>{p.name}</div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>{p.desc}</div>
                      </div>
                    </div>
                    <div style={{ width: '120px', textAlign: 'right' }}>
                      <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>{p.progress}%</div>
                      <div style={{ width: '100%', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '9999px', overflow: 'hidden' }}>
                        <div style={{ width: `${p.progress}%`, height: '100%', backgroundColor: '#4f46e5', borderRadius: '9999px' }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Recent Activity Card */}
            <Card
              title="Recent Activity"
              headerAction={
                <button
                  onClick={() => navigate('/notifications')}
                  style={{ fontSize: '13px', fontWeight: 600, color: '#4f46e5', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  View All <ArrowRight size={14} />
                </button>
              }
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {[
                  { text: 'Priya Sharma created a new project "Mobile App"', time: '10 minutes ago', icon: <Plus size={16} color="#10b981" />, bg: '#ecfdf5' },
                  { text: 'You added 3 members to "QuickChat"', time: '25 minutes ago', icon: <UserPlus size={16} color="#3b82f6" />, bg: '#eff6ff' },
                  { text: 'Rahul Kumar completed task "Setup CI/CD"', time: '1 hour ago', icon: <CheckCircle2 size={16} color="#8b5cf6" />, bg: '#f5f3ff' },
                  { text: 'Amit Naik updated task "Design Dashboard"', time: '2 hours ago', icon: <FileEdit size={16} color="#f59e0b" />, bg: '#fffbeb' },
                ].map((act, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: act.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {act.icon}
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 500, color: '#1e293b' }}>{act.text}</div>
                      <div style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '2px' }}>{act.time}</div>
                    </div>
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
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>My Tasks</div>
                  <div style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a' }}>12</div>
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
                  <div style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a' }}>5</div>
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
                  <div style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a' }}>18</div>
                </div>
              </div>
            </Card>

            <Card style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626' }}>
                  <Calendar size={24} />
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>Due Soon</div>
                  <div style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a' }}>3</div>
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
                  style={{ fontSize: '13px', fontWeight: 600, color: '#4f46e5', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  View All <ArrowRight size={14} />
                </button>
              }
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {[
                  { title: 'Update project documentation', status: 'In Progress', variant: 'progress' as const },
                  { title: 'Fix login issue', status: 'In Progress', variant: 'progress' as const },
                  { title: 'Review pull request', status: 'To Do', variant: 'pending' as const },
                  { title: 'Prepare release notes', status: 'To Do', variant: 'pending' as const },
                ].map((t, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: idx < 3 ? '1px solid #f1f5f9' : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <input type="checkbox" style={{ accentColor: '#4f46e5', width: '16px', height: '16px', borderRadius: '4px' }} />
                      <span style={{ fontSize: '14px', fontWeight: 500, color: '#1e293b' }}>{t.title}</span>
                    </div>
                    <Badge variant={t.variant}>{t.status}</Badge>
                  </div>
                ))}
              </div>
            </Card>

            <Card
              title="My Projects"
              headerAction={
                <button
                  onClick={() => navigate('/projects')}
                  style={{ fontSize: '13px', fontWeight: 600, color: '#4f46e5', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  View All <ArrowRight size={14} />
                </button>
              }
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                {[
                  { name: 'Website Redesign', progress: 70 },
                  { name: 'Mobile App', progress: 45 },
                  { name: 'API Integration', progress: 90 },
                ].map((p, idx) => (
                  <div key={idx}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Folder size={18} color="#4f46e5" />
                        <span style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>{p.name}</span>
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#475569' }}>{p.progress}%</span>
                    </div>
                    <div style={{ width: '100%', height: '7px', backgroundColor: '#f1f5f9', borderRadius: '9999px', overflow: 'hidden' }}>
                      <div style={{ width: `${p.progress}%`, height: '100%', backgroundColor: '#4f46e5', borderRadius: '9999px' }} />
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
