import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';

export default function Settings() {
  const { theme, toggleTheme } = useTheme();
  const [trainingStatus, setTrainingStatus] = useState(localStorage.getItem('trainingStatus') || 'not trained');
  const [jiraEnabled, setJiraEnabled] = useState(JSON.parse(localStorage.getItem('jiraEnabled') || 'false'));
  const [recipientEmail, setRecipientEmail] = useState(localStorage.getItem('recipientEmail') || '');

  useEffect(() => {
    const jiraDetails = {
      url: process.env.REACT_APP_JIRA_URL,
      username: process.env.REACT_APP_JIRA_USERNAME,
      apiToken: process.env.REACT_APP_JIRA_API_TOKEN,
      projectKey: process.env.REACT_APP_JIRA_PROJECT_KEY,
    };
    localStorage.setItem('jiraDetails', JSON.stringify(jiraDetails));

    const emailSettings = {
      smtpServer: process.env.REACT_APP_SMTP_SERVER,
      smtpPort: process.env.REACT_APP_SMTP_PORT,
      email: process.env.REACT_APP_EMAIL,
      password: process.env.REACT_APP_EMAIL_PASSWORD,
    };
    localStorage.setItem('emailSettings', JSON.stringify(emailSettings));
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch("/api/upload", {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to generate json model');
      }

      const data = await response.json();
      const trainResposne = await fetch("/train", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!trainResposne.ok) {
        const errorText = await trainResposne.text();
        throw new Error('Failed to trigger training on uploaded data');
      }

      const trainResponseData = await trainResposne.json();

      localStorage.setItem('trainingStatus', 'Triggered Training on your data');
      setTrainingStatus(trainResponseData.message);
    } catch (err) {
      console.error('Error training model:', err);
      localStorage.setItem('trainingStatus', 'not trained');
      setTrainingStatus('not trained');
      alert('Failed to train model');
    }
  };

  const handleJiraEnabledChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isEnabled = e.target.checked;
    setJiraEnabled(isEnabled);
    localStorage.setItem('jiraEnabled', JSON.stringify(isEnabled));
  };

  const handleRecipientEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const email = e.target.value;
    setRecipientEmail(email);
    localStorage.setItem('recipientEmail', email);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Settings</h2>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Theme Preferences
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Choose between light and dark theme
            </p>
          </div>
          <button
            onClick={toggleTheme}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            {theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mt-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Train Model
        </h3>
        <div className="mt-4">
          <label className="block text-gray-700 dark:text-gray-300">Upload Training File</label>
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileUpload}
            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
        <p className="mt-4 text-gray-700 dark:text-gray-300">
          Training Status: <span className="font-semibold">{trainingStatus}</span>
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mt-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Jira Workflow
        </h3>
        <div className="mt-4 flex items-center space-x-2">
          <input
            type="checkbox"
            checked={jiraEnabled}
            onChange={handleJiraEnabledChange}
            className="mt-1"
          />
          <label className="text-gray-700 dark:text-gray-300">Enable Jira Workflow</label>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mt-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Email Settings
        </h3>
        <div className="mt-4">
          <label className="block text-gray-700 dark:text-gray-300">Recipient Email</label>
          <input
            type="email"
            value={recipientEmail}
            onChange={handleRecipientEmailChange}
            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
      </div>
    </div>
  );
}