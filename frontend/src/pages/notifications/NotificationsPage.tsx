import React, { useState, useEffect } from "react";
import {
  Bell,
  CheckCheck,
  Settings as SettingsIcon,
  CheckCircle2,
  UserPlus,
  Layers,
  MessageSquare,
  CheckSquare,
  Clock,
  Loader2,
  Trash2,
} from "lucide-react";
import { useNotificationStore } from "../../stores/notificationStore";
import { Button } from "../../components/common/Button";
import { Modal } from "../../components/common/Modal";

export const NotificationsPage: React.FC = () => {
  const {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
  } = useNotificationStore();

  const [activeFilter, setActiveFilter] = useState<
    "All" | "Unread" | "Project" | "Task"
  >("All");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [justReadIds, setJustReadIds] = useState<Set<string>>(new Set());

  // Notification Settings toggles
  const [taskUpdates, setTaskUpdates] = useState(true);
  const [projectUpdates, setProjectUpdates] = useState(true);
  const [mentions, setMentions] = useState(true);
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [inAppNotifs, setInAppNotifs] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleTabChange = (filter: "All" | "Unread" | "Project" | "Task") => {
    setActiveFilter(filter);
    setJustReadIds(new Set());
  };

  const handleMarkAsRead = (id: string) => {
    setJustReadIds((prev) => new Set(prev).add(id));
    markAsRead(id);
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
    setJustReadIds(new Set());
  };

  const filtered = notifications.filter((n) => {
    if (activeFilter === "Unread") return !n.isRead || justReadIds.has(n.id);
    if (activeFilter === "Project") return n.type.startsWith("project");
    if (activeFilter === "Task") return n.type.startsWith("task");
    return true;
  });

  const getIcon = (type: string) => {
    switch (type) {
      case "task_assigned":
        return <CheckSquare size={18} color="#4f46e5" />;
      case "task_completed":
        return <CheckCircle2 size={18} color="#10b981" />;
      case "task_updated":
        return <Clock size={18} color="#0284c7" />;
      case "project_updated":
      case "project_assigned":
        return <Layers size={18} color="#3b82f6" />;
      case "comment":
        return <MessageSquare size={18} color="#f59e0b" />;
      default:
        return <Bell size={18} color="#8b5cf6" />;
    }
  };

  return (
    <div>
      {/* Page Heading & Actions */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "24px",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "6px",
                backgroundColor: "#eef2ff",
                color: "#4f46e5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Bell size={16} />
            </div>
            <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#0f172a" }}>
              Notifications
            </h1>
          </div>
          <p style={{ fontSize: "13.5px", color: "#64748b", marginTop: "2px" }}>
            Stay updated with project, task and team activities.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {notifications.length > 0 && (
            <Button
              variant="outline"
              icon={<Trash2 size={16} />}
              onClick={() => clearAllNotifications()}
              style={{ color: "#ef4444", borderColor: "#fecaca" }}
            >
              Clear all
            </Button>
          )}

          <Button
            variant="outline"
            icon={<CheckCheck size={16} />}
            onClick={() => handleMarkAllAsRead()}
          >
            Mark all as read
          </Button>

          <Button
            variant="outline"
            icon={<SettingsIcon size={16} />}
            onClick={() => setIsSettingsOpen(true)}
          >
            Notification Settings
          </Button>
        </div>
      </div>

      {/* Main Container Card */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
          overflow: "hidden",
          padding: "24px",
        }}
      >
        {/* Filter Pills */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "28px",
          }}
        >
          {(["All", "Unread", "Project", "Task"] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => handleTabChange(filter)}
              style={{
                padding: "7px 18px",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: 600,
                backgroundColor:
                  activeFilter === filter ? "#4f46e5" : "#f8fafc",
                color: activeFilter === filter ? "#ffffff" : "#475569",
                border: activeFilter === filter ? "none" : "1px solid #e2e8f0",
                transition: "all 0.15s ease",
                cursor: "pointer",
              }}
            >
              {filter}{" "}
              {filter === "Unread" && unreadCount > 0 ? `(${unreadCount})` : ""}
            </button>
          ))}
        </div>

        {/* Notifications List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {isLoading && notifications.length === 0 ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "60px 0",
                color: "#64748b",
                gap: "10px",
              }}
            >
              <Loader2 size={24} className="spin-animate" />
              <span>Loading notifications...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "48px 0",
                color: "#94a3b8",
              }}
            >
              <Bell size={40} style={{ margin: "0 auto 12px", opacity: 0.5 }} />
              <div style={{ fontSize: "15px", fontWeight: 600 }}>
                No notifications found
              </div>
              <p
                style={{ fontSize: "13px", color: "#94a3b8", marginTop: "4px" }}
              >
                {activeFilter === "Unread"
                  ? "You are all caught up!"
                  : "No notifications in this filter category."}
              </p>
            </div>
          ) : (
            filtered.map((item) => {
              const isItemRead = item.isRead && !justReadIds.has(item.id);
              const isNewlyRead = justReadIds.has(item.id);

              return (
                <div
                  key={item.id}
                  onClick={() => handleMarkAsRead(item.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "16px 20px",
                    borderRadius: "12px",
                    backgroundColor: item.isRead ? "#ffffff" : "#f0f7ff",
                    border: `1px solid ${item.isRead ? "#e2e8f0" : "#c7d2fe"}`,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (item.isRead)
                      e.currentTarget.style.backgroundColor = "#fafafa";
                  }}
                  onMouseLeave={(e) => {
                    if (item.isRead)
                      e.currentTarget.style.backgroundColor = "#ffffff";
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "14px",
                    }}
                  >
                    <div
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "10px",
                        backgroundColor: "#ffffff",
                        border: "1px solid #e2e8f0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {getIcon(item.type)}
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: "14px",
                          fontWeight: item.isRead ? 600 : 700,
                          color: "#0f172a",
                        }}
                      >
                        {item.title}
                      </div>
                      <div
                        style={{
                          fontSize: "13px",
                          color: "#475569",
                          marginTop: "2px",
                        }}
                      >
                        {item.message}
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      flexShrink: 0,
                    }}
                  >
                    <span style={{ fontSize: "12.5px", color: "#94a3b8" }}>
                      {new Date(item.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(item.id);
                      }}
                      title="Delete notification"
                      style={{
                        padding: "6px",
                        borderRadius: "6px",
                        border: "none",
                        backgroundColor: "transparent",
                        color: "#94a3b8",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.15s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#fee2e2";
                        e.currentTarget.style.color = "#dc2626";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                        e.currentTarget.style.color = "#94a3b8";
                      }}
                    >
                      <Trash2 size={15} />
                    </button>
                    {/* {!item.isRead ? (
                      <span
                        title="Unread notification"
                        style={{
                          width: "9px",
                          height: "9px",
                          borderRadius: "50%",
                          backgroundColor: "#4f46e5",
                        }}
                      />
                    ) : isNewlyRead ? (
                      <span
                        style={{
                          fontSize: "11px",
                          color: "#10b981",
                          fontWeight: 600,
                          backgroundColor: "#ecfdf5",
                          padding: "2px 8px",
                          borderRadius: "6px",
                        }}
                      >
                        Just read
                      </span>
                    ) : null} */}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal: Notification Settings */}
      <Modal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        title="Notification Settings"
        subtitle="Configure how and when you want to receive notifications."
        maxWidth="600px"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div>
            <h4
              style={{
                fontSize: "14px",
                fontWeight: 700,
                color: "#0f172a",
                marginBottom: "14px",
              }}
            >
              General Notifications
            </h4>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "13.5px",
                      fontWeight: 600,
                      color: "#1e293b",
                    }}
                  >
                    Task Updates
                  </div>
                  <div style={{ fontSize: "12px", color: "#64748b" }}>
                    Get notified when a task is created, updated, or completed.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={taskUpdates}
                  onChange={(e) => setTaskUpdates(e.target.checked)}
                  style={{
                    accentColor: "#4f46e5",
                    width: "20px",
                    height: "20px",
                  }}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "13.5px",
                      fontWeight: 600,
                      color: "#1e293b",
                    }}
                  >
                    Project Updates
                  </div>
                  <div style={{ fontSize: "12px", color: "#64748b" }}>
                    Get notified about project changes, members, and progress.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={projectUpdates}
                  onChange={(e) => setProjectUpdates(e.target.checked)}
                  style={{
                    accentColor: "#4f46e5",
                    width: "20px",
                    height: "20px",
                  }}
                />
              </div>

              {/* <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#1e293b' }}>Mentions</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Get notified when someone mentions you in a comment.</div>
                </div>
                <input
                  type="checkbox"
                  checked={mentions}
                  onChange={(e) => setMentions(e.target.checked)}
                  style={{ accentColor: '#4f46e5', width: '20px', height: '20px' }}
                />
              </div> */}
            </div>
          </div>

          {/* <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "20px" }}>
            <h4
              style={{
                fontSize: "14px",
                fontWeight: 700,
                color: "#0f172a",
                marginBottom: "14px",
              }}
            >
              Notification Channels
            </h4>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "13.5px",
                      fontWeight: 600,
                      color: "#1e293b",
                    }}
                  >
                    Email Notifications
                  </div>
                  <div style={{ fontSize: "12px", color: "#64748b" }}>
                    Receive notifications via email.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={emailNotifs}
                  onChange={(e) => setEmailNotifs(e.target.checked)}
                  style={{
                    accentColor: "#4f46e5",
                    width: "20px",
                    height: "20px",
                  }}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "13.5px",
                      fontWeight: 600,
                      color: "#1e293b",
                    }}
                  >
                    In-App Notifications
                  </div>
                  <div style={{ fontSize: "12px", color: "#64748b" }}>
                    Show notifications inside the application.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={inAppNotifs}
                  onChange={(e) => setInAppNotifs(e.target.checked)}
                  style={{
                    accentColor: "#4f46e5",
                    width: "20px",
                    height: "20px",
                  }}
                />
              </div>
            </div>
          </div> */}

          <div
            style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}
          >
            <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => setIsSettingsOpen(false)}>
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
