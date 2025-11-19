import { Bell, Database, Globe, Settings, Shield, Users } from "lucide-react";
import { useState } from "react";
import { Button } from "../../../components/ui/Button";
import { Tabs } from "../../../components/ui/Tabs";

export const AdminSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState("general");

  const tabs = [
    { id: "general", label: "General", icon: <Settings className="w-4 h-4" /> },
    { id: "security", label: "Security", icon: <Shield className="w-4 h-4" /> },
    {
      id: "notifications",
      label: "Notifications",
      icon: <Bell className="w-4 h-4" />,
    },
    {
      id: "database",
      label: "Database",
      icon: <Database className="w-4 h-4" />,
    },
    { id: "api", label: "API", icon: <Globe className="w-4 h-4" /> },
    {
      id: "users",
      label: "User Management",
      icon: <Users className="w-4 h-4" />,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-base-content">Settings</h1>
        <p className="text-base-content/70 mt-1">
          Configure system settings and preferences
        </p>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        variant="boxed"
      />

      {/* Tab Content */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          {activeTab === "general" && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">General Settings</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Store Name</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered"
                    defaultValue="My Store"
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Currency</span>
                  </label>
                  <select className="select select-bordered">
                    <option>USD ($)</option>
                    <option>EUR (€)</option>
                    <option>GBP (£)</option>
                  </select>
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Store Description</span>
                </label>
                <textarea
                  className="textarea textarea-bordered"
                  rows={3}
                  defaultValue="AI-powered e-commerce platform with personalized shopping experience"
                ></textarea>
              </div>

              <div className="flex space-x-4">
                <Button variant="primary">Save Changes</Button>
                <Button variant="outline">Reset</Button>
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Security Settings</h3>

              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 border border-base-300 rounded-lg">
                  <div>
                    <h4 className="font-medium">Two-Factor Authentication</h4>
                    <p className="text-sm text-base-content/70">
                      Require 2FA for admin accounts
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    defaultChecked
                  />
                </div>

                <div className="flex justify-between items-center p-4 border border-base-300 rounded-lg">
                  <div>
                    <h4 className="font-medium">Session Timeout</h4>
                    <p className="text-sm text-base-content/70">
                      Auto-logout after inactivity
                    </p>
                  </div>
                  <select className="select select-bordered select-sm">
                    <option>30 minutes</option>
                    <option>1 hour</option>
                    <option>2 hours</option>
                  </select>
                </div>

                <div className="flex justify-between items-center p-4 border border-base-300 rounded-lg">
                  <div>
                    <h4 className="font-medium">Login Attempts</h4>
                    <p className="text-sm text-base-content/70">
                      Maximum failed login attempts
                    </p>
                  </div>
                  <input
                    type="number"
                    className="input input-bordered input-sm w-20"
                    defaultValue="5"
                  />
                </div>
              </div>

              <Button variant="primary">Update Security Settings</Button>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Notification Settings</h3>

              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 border border-base-300 rounded-lg">
                  <div>
                    <h4 className="font-medium">Email Notifications</h4>
                    <p className="text-sm text-base-content/70">
                      Send email alerts for important events
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    defaultChecked
                  />
                </div>

                <div className="flex justify-between items-center p-4 border border-base-300 rounded-lg">
                  <div>
                    <h4 className="font-medium">Order Notifications</h4>
                    <p className="text-sm text-base-content/70">
                      Notify on new orders
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    defaultChecked
                  />
                </div>

                <div className="flex justify-between items-center p-4 border border-base-300 rounded-lg">
                  <div>
                    <h4 className="font-medium">Low Stock Alerts</h4>
                    <p className="text-sm text-base-content/70">
                      Alert when products are low in stock
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    defaultChecked
                  />
                </div>
              </div>

              <Button variant="primary">Save Notification Settings</Button>
            </div>
          )}

          {activeTab === "database" && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Database Management</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="card bg-base-200">
                  <div className="card-body text-center">
                    <h4 className="font-medium">Backup Database</h4>
                    <p className="text-sm text-base-content/70 mb-4">
                      Create a backup of your database
                    </p>
                    <Button variant="primary" size="sm">
                      Create Backup
                    </Button>
                  </div>
                </div>

                <div className="card bg-base-200">
                  <div className="card-body text-center">
                    <h4 className="font-medium">Database Stats</h4>
                    <div className="stats stats-vertical mt-4">
                      <div className="stat">
                        <div className="stat-title text-xs">Total Records</div>
                        <div className="stat-value text-lg">15,324</div>
                      </div>
                      <div className="stat">
                        <div className="stat-title text-xs">Size</div>
                        <div className="stat-value text-lg">2.4 GB</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "api" && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">API Configuration</h3>

              <div className="space-y-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">API Rate Limit</span>
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      className="input input-bordered flex-1"
                      defaultValue="1000"
                    />
                    <span className="flex items-center px-3">
                      requests/hour
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center p-4 border border-base-300 rounded-lg">
                  <div>
                    <h4 className="font-medium">API Documentation</h4>
                    <p className="text-sm text-base-content/70">
                      Enable public API documentation
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    defaultChecked
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Webhook URL</span>
                  </label>
                  <input
                    type="url"
                    className="input input-bordered"
                    placeholder="https://your-webhook-url.com"
                  />
                </div>
              </div>

              <Button variant="primary">Update API Settings</Button>
            </div>
          )}

          {activeTab === "users" && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">
                User Management Settings
              </h3>

              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 border border-base-300 rounded-lg">
                  <div>
                    <h4 className="font-medium">User Registration</h4>
                    <p className="text-sm text-base-content/70">
                      Allow new user registrations
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    defaultChecked
                  />
                </div>

                <div className="flex justify-between items-center p-4 border border-base-300 rounded-lg">
                  <div>
                    <h4 className="font-medium">Email Verification</h4>
                    <p className="text-sm text-base-content/70">
                      Require email verification for new accounts
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    defaultChecked
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Default User Role</span>
                  </label>
                  <select className="select select-bordered">
                    <option>Customer</option>
                    <option>Member</option>
                    <option>VIP</option>
                  </select>
                </div>
              </div>

              <Button variant="primary">Save User Settings</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
