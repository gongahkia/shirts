import React from 'react';
import { useDarkMode } from '@/hooks/useDarkMode';
import {
  MoonIcon,
  SunIcon,
  BellIcon,
  ShieldCheckIcon,
  CogIcon,
} from '@heroicons/react/24/outline';

function Settings() {
  const { isDarkMode, toggleDarkMode } = useDarkMode();

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-legal font-bold text-gray-900 dark:text-white">
          Settings
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage your application preferences and configuration
        </p>
      </div>

      {/* Appearance */}
      <div className="card p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
            {isDarkMode ? (
              <MoonIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            ) : (
              <SunIcon className="h-5 w-5 text-purple-600" />
            )}
          </div>
          <div>
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">
              Appearance
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Customize the look and feel of the application
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                Dark Mode
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Use dark theme for better viewing in low light
              </p>
            </div>
            <button
              onClick={toggleDarkMode}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-legal-500 focus:ring-offset-2 ${
                isDarkMode ? 'bg-legal-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  isDarkMode ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                Theme
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Current theme: {isDarkMode ? 'Dark' : 'Light'}
              </p>
            </div>
            <select className="input w-32">
              <option value="auto">Auto</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="card p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
            <BellIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">
              Notifications
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Configure when and how you receive notifications
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                Workflow Updates
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Get notified when workflows complete or encounter errors
              </p>
            </div>
            <input
              type="checkbox"
              defaultChecked
              className="h-4 w-4 text-legal-600 focus:ring-legal-500 border-gray-300 rounded"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                Case Updates
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Receive notifications for case status changes
              </p>
            </div>
            <input
              type="checkbox"
              defaultChecked
              className="h-4 w-4 text-legal-600 focus:ring-legal-500 border-gray-300 rounded"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                Agent Alerts
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Get alerts when agents go offline or encounter errors
              </p>
            </div>
            <input
              type="checkbox"
              defaultChecked
              className="h-4 w-4 text-legal-600 focus:ring-legal-500 border-gray-300 rounded"
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                Email Notifications
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Receive important updates via email
              </p>
            </div>
            <input
              type="checkbox"
              className="h-4 w-4 text-legal-600 focus:ring-legal-500 border-gray-300 rounded"
            />
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="card p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
            <ShieldCheckIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">
              Security & Privacy
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Manage your security settings and data privacy
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                Session Timeout
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Automatically log out after inactivity
              </p>
            </div>
            <select className="input w-32">
              <option value="15">15 minutes</option>
              <option value="30">30 minutes</option>
              <option value="60">1 hour</option>
              <option value="240">4 hours</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                Two-Factor Authentication
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Add an extra layer of security to your account
              </p>
            </div>
            <button className="btn-secondary text-sm">
              Enable 2FA
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                Data Encryption
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                All data is encrypted at rest and in transit
              </p>
            </div>
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              Enabled
            </span>
          </div>
        </div>
      </div>

      {/* System */}
      <div className="card p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <CogIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </div>
          <div>
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">
              System
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Application settings and system information
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                Application Version
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Current version of the Shirts Legal Workflow application
              </p>
            </div>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              v1.0.0
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                API Endpoint
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Backend API connection status
              </p>
            </div>
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              Connected
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                WebSocket Connection
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Real-time updates connection status
              </p>
            </div>
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              Connected
            </span>
          </div>

          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex space-x-3">
              <button className="btn-secondary">
                Export Data
              </button>
              <button className="btn-danger">
                Clear Cache
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button className="btn-primary">
          Save Settings
        </button>
      </div>
    </div>
  );
}

export default Settings;