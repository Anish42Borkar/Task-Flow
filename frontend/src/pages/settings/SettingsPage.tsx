import React, { useState, useEffect } from "react";
import {
  Settings as SettingsIcon,
  Shield,
  Info,
  KeyRound,
  Check,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Button } from "../../components/common/Button";
import { Input } from "../../components/common/Input";
import { Card } from "../../components/common/Card";
import { Modal } from "../../components/common/Modal";
import { useSettingsStore } from "../../stores/settingsStore";
import { useNotificationStore } from "../../stores/notificationStore";
import { api } from "../../services/api";

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"general" | "security" | "about">(
    "general",
  );

  const {
    appName,
    theme,
    timezone,
    dateFormat,
    twoFactor,
    isLoading,
    isSaving,
    fetchSettings,
    updateSettings,
  } = useSettingsStore();

  const { addToast } = useNotificationStore();

  // Local form state
  const [formAppName, setFormAppName] = useState(appName);
  const [formTheme, setFormTheme] = useState(theme);
  const [formTimezone, setFormTimezone] = useState(timezone);
  const [formDateFormat, setFormDateFormat] = useState(dateFormat);
  const [formTwoFactor, setFormTwoFactor] = useState(twoFactor);

  // Change password modal state
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Sync form state when store loads or updates
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    setFormAppName(appName);
    setFormTheme(theme);
    setFormTimezone(timezone);
    setFormDateFormat(dateFormat);
    setFormTwoFactor(twoFactor);
  }, [appName, theme, timezone, dateFormat, twoFactor]);

  const handleSave = async () => {
    if (!formAppName.trim()) {
      addToast("Validation Error", "Application name cannot be empty", "error");
      return;
    }

    try {
      await updateSettings({
        appName: formAppName.trim(),
        theme: formTheme,
        timezone: formTimezone,
        dateFormat: formDateFormat,
        twoFactor: formTwoFactor,
      });
      addToast("Success", "Application settings saved successfully", "success");
    } catch (err: any) {
      addToast("Error", err.message || "Failed to save settings", "error");
    }
  };

  const handleCancel = () => {
    setFormAppName(appName);
    setFormTheme(theme);
    setFormTimezone(timezone);
    setFormDateFormat(dateFormat);
    setFormTwoFactor(twoFactor);
    addToast("Reset", "Form reverted to current settings", "info");
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      addToast(
        "Validation Error",
        "Please fill in all password fields",
        "error",
      );
      return;
    }

    if (newPassword.length < 8) {
      addToast(
        "Validation Error",
        "New password must be at least 8 characters",
        "error",
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      addToast(
        "Validation Error",
        "New password and confirmation do not match",
        "error",
      );
      return;
    }

    try {
      setIsChangingPassword(true);
      await api.put("/auth/change-password", {
        currentPassword,
        newPassword,
      });
      addToast("Success", "Password updated successfully", "success");
      setIsPasswordModalOpen(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      addToast("Error", err.message || "Failed to update password", "error");
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div>
      {/* Page Heading */}
      <div style={{ marginBottom: "24px" }}>
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
            <SettingsIcon size={16} />
          </div>
          <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#0f172a" }}>
            Settings
          </h1>
        </div>
        <p style={{ fontSize: "13.5px", color: "#64748b", marginTop: "2px" }}>
          Manage your application preferences and configurations.
        </p>
      </div>

      {/* Tabs Switcher */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
        <button
          onClick={() => setActiveTab("general")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "9px 20px",
            borderRadius: "10px",
            fontSize: "13.5px",
            fontWeight: 600,
            backgroundColor: activeTab === "general" ? "#4f46e5" : "#ffffff",
            color: activeTab === "general" ? "#ffffff" : "#475569",
            border: activeTab === "general" ? "none" : "1px solid #e2e8f0",
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
        >
          <SettingsIcon size={16} />
          General
        </button>

        {/* <button
          onClick={() => setActiveTab("security")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "9px 20px",
            borderRadius: "10px",
            fontSize: "13.5px",
            fontWeight: 600,
            backgroundColor: activeTab === "security" ? "#4f46e5" : "#ffffff",
            color: activeTab === "security" ? "#ffffff" : "#475569",
            border: activeTab === "security" ? "none" : "1px solid #e2e8f0",
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
        >
          <Shield size={16} />
          Security
        </button> */}

        <button
          onClick={() => setActiveTab("about")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "9px 20px",
            borderRadius: "10px",
            fontSize: "13.5px",
            fontWeight: 600,
            backgroundColor: activeTab === "about" ? "#4f46e5" : "#ffffff",
            color: activeTab === "about" ? "#ffffff" : "#475569",
            border: activeTab === "about" ? "none" : "1px solid #e2e8f0",
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
        >
          <Info size={16} />
          About
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === "general" && (
        <Card
          title="General Settings"
          subtitle="Configure basic application settings."
        >
          {isLoading ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "30px 0",
                color: "#64748b",
              }}
            >
              <Loader2 className="animate-spin" size={20} />
              <span>Loading system preferences...</span>
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "22px",
                maxWidth: "640px",
                marginTop: "16px",
              }}
            >
              <div>
                <label
                  style={{
                    fontSize: "13.5px",
                    fontWeight: 600,
                    color: "#1e293b",
                    marginBottom: "6px",
                    display: "block",
                  }}
                >
                  Application Name
                </label>
                <input
                  type="text"
                  value={formAppName}
                  onChange={(e) => setFormAppName(e.target.value)}
                  placeholder="e.g. TaskFlow"
                  style={{
                    width: "100%",
                    padding: "11px 14px",
                    borderRadius: "10px",
                    border: "1.5px solid #e2e8f0",
                    fontSize: "14px",
                    backgroundColor: "#ffffff",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
                <span
                  style={{
                    fontSize: "12px",
                    color: "#64748b",
                    marginTop: "4px",
                    display: "block",
                  }}
                >
                  This name appears in the browser title, top header, and
                  navigation sidebar.
                </span>
              </div>

              <div>
                <label
                  style={{
                    fontSize: "13.5px",
                    fontWeight: 600,
                    color: "#1e293b",
                    marginBottom: "6px",
                    display: "block",
                  }}
                >
                  Theme
                </label>
                <select
                  value={formTheme}
                  onChange={(e) => setFormTheme(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "11px 14px",
                    borderRadius: "10px",
                    border: "1.5px solid #e2e8f0",
                    fontSize: "14px",
                    backgroundColor: "#ffffff",
                  }}
                >
                  <option value="Light">Light</option>
                  <option value="Dark">Dark</option>
                  <option value="System Default">System Default</option>
                </select>
              </div>

              <div>
                <label
                  style={{
                    fontSize: "13.5px",
                    fontWeight: 600,
                    color: "#1e293b",
                    marginBottom: "6px",
                    display: "block",
                  }}
                >
                  Timezone
                </label>
                <select
                  value={formTimezone}
                  onChange={(e) => setFormTimezone(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "11px 14px",
                    borderRadius: "10px",
                    border: "1.5px solid #e2e8f0",
                    fontSize: "14px",
                    backgroundColor: "#ffffff",
                  }}
                >
                  <option value="(GMT+05:30) India Standard Time">
                    (GMT+05:30) India Standard Time (IST)
                  </option>
                  <option value="(GMT+00:00) UTC">
                    (GMT+00:00) UTC / Greenwich Mean Time
                  </option>
                  <option value="(GMT-05:00) Eastern Time (US & Canada)">
                    (GMT-05:00) Eastern Time (US & Canada)
                  </option>
                  <option value="(GMT-08:00) Pacific Time (US & Canada)">
                    (GMT-08:00) Pacific Time (US & Canada)
                  </option>
                  <option value="(GMT+01:00) Central European Time">
                    (GMT+01:00) Central European Time (CET)
                  </option>
                  <option value="(GMT+08:00) Singapore Standard Time">
                    (GMT+08:00) Singapore / China Standard Time
                  </option>
                  <option value="(GMT+09:00) Japan Standard Time">
                    (GMT+09:00) Japan Standard Time (JST)
                  </option>
                </select>
              </div>

              <div>
                <label
                  style={{
                    fontSize: "13.5px",
                    fontWeight: 600,
                    color: "#1e293b",
                    marginBottom: "6px",
                    display: "block",
                  }}
                >
                  Date Format
                </label>
                <select
                  value={formDateFormat}
                  onChange={(e) => setFormDateFormat(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "11px 14px",
                    borderRadius: "10px",
                    border: "1.5px solid #e2e8f0",
                    fontSize: "14px",
                    backgroundColor: "#ffffff",
                  }}
                >
                  <option value="DD MMM, YYYY (e.g. 28 Oct, 2026)">
                    DD MMM, YYYY (e.g. 28 Oct, 2026)
                  </option>
                  <option value="YYYY-MM-DD">
                    YYYY-MM-DD (e.g. 2026-10-28)
                  </option>
                  <option value="MM/DD/YYYY">
                    MM/DD/YYYY (e.g. 10/28/2026)
                  </option>
                  <option value="DD/MM/YYYY">
                    DD/MM/YYYY (e.g. 28/10/2026)
                  </option>
                </select>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "10px",
                  marginTop: "12px",
                }}
              >
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <Loader2 className="animate-spin" size={16} />
                      Saving...
                    </span>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {activeTab === "security" && (
        <Card
          title="Security Settings"
          subtitle="Manage your account security and authentication credentials."
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "24px",
              maxWidth: "640px",
              marginTop: "16px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 0",
                borderBottom: "1px solid #f1f5f9",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "14px" }}
              >
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "10px",
                    backgroundColor: "#eff6ff",
                    color: "#2563eb",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <KeyRound size={20} />
                </div>
                <div>
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: 700,
                      color: "#0f172a",
                    }}
                  >
                    Account Password
                  </div>
                  <div style={{ fontSize: "12.5px", color: "#64748b" }}>
                    Update your account password to keep your account safe.
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPasswordModalOpen(true)}
              >
                Change Password
              </Button>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 0",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "14px" }}
              >
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "10px",
                    backgroundColor: "#ecfdf5",
                    color: "#059669",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Shield size={20} />
                </div>
                <div>
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: 700,
                      color: "#0f172a",
                    }}
                  >
                    Two-Factor Authentication (2FA)
                  </div>
                  <div style={{ fontSize: "12.5px", color: "#64748b" }}>
                    Require a confirmation code upon every login attempt.
                  </div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={formTwoFactor}
                onChange={async (e) => {
                  const val = e.target.checked;
                  setFormTwoFactor(val);
                  try {
                    await updateSettings({ twoFactor: val });
                    addToast(
                      "Security Updated",
                      `Two-factor authentication has been ${val ? "enabled" : "disabled"}`,
                      "success",
                    );
                  } catch (err: any) {
                    setFormTwoFactor(!val);
                    addToast(
                      "Error",
                      err.message || "Failed to update 2FA setting",
                      "error",
                    );
                  }
                }}
                style={{
                  accentColor: "#4f46e5",
                  width: "20px",
                  height: "20px",
                  cursor: "pointer",
                }}
              />
            </div>
          </div>
        </Card>
      )}

      {activeTab === "about" && (
        <Card
          title={`About ${formAppName || "TaskFlow"}`}
          subtitle="Application information and version details."
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.2fr 1fr",
              gap: "40px",
              marginTop: "20px",
              alignItems: "center",
            }}
          >
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  marginBottom: "16px",
                }}
              >
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "12px",
                    backgroundColor: "#4f46e5",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Check size={28} strokeWidth={3} />
                </div>
                <div>
                  <h3
                    style={{
                      fontSize: "20px",
                      fontWeight: 800,
                      color: "#0f172a",
                    }}
                  >
                    {formAppName || "TaskFlow"}
                  </h3>
                  <div
                    style={{
                      fontSize: "12.5px",
                      color: "#64748b",
                      fontWeight: 600,
                    }}
                  >
                    Version 1.0.0
                  </div>
                </div>
              </div>
              <p
                style={{ fontSize: "14px", color: "#475569", lineHeight: 1.6 }}
              >
                A high-performance enterprise task and project management suite
                built with real-time WebSocket updates, granular RBAC
                permissions, and persistent workflow automation.
              </p>
            </div>

            <div
              style={{
                backgroundColor: "#f8fafc",
                padding: "20px",
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
                display: "flex",
                flexDirection: "column",
                gap: "14px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "13.5px",
                }}
              >
                <span style={{ color: "#64748b" }}>Build Version</span>
                <span style={{ fontWeight: 700, color: "#0f172a" }}>
                  v1.0.0
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "13.5px",
                }}
              >
                <span style={{ color: "#64748b" }}>Backend API</span>
                <span style={{ fontWeight: 700, color: "#4f46e5" }}>
                  Active (NestJS & PostgreSQL)
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "13.5px",
                }}
              >
                <span style={{ color: "#64748b" }}>Configured Timezone</span>
                <span style={{ fontWeight: 700, color: "#0f172a" }}>
                  {formTimezone.split(" ")[0]}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "13.5px",
                }}
              >
                <span style={{ color: "#64748b" }}>Date Format</span>
                <span style={{ fontWeight: 700, color: "#0f172a" }}>
                  {formDateFormat.split(" ")[0]}
                </span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Change Password Modal */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        title="Change Password"
        subtitle="Ensure your account stays secure with a strong password."
      >
        <form onSubmit={handleChangePassword}>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            <Input
              label="Current Password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
            <Input
              label="New Password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min. 8 characters"
              required
            />
            <Input
              label="Confirm New Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-type new password"
              required
            />

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
                marginTop: "12px",
              }}
            >
              <Button
                variant="outline"
                type="button"
                onClick={() => setIsPasswordModalOpen(false)}
                disabled={isChangingPassword}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                disabled={isChangingPassword}
              >
                {isChangingPassword ? (
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <Loader2 className="animate-spin" size={16} />
                    Updating...
                  </span>
                ) : (
                  "Update Password"
                )}
              </Button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};
