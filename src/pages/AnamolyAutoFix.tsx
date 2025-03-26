import React, { useState } from 'react';
import { Upload } from 'lucide-react';
import DataTable from '../components/DataTable';
import { v4 as uuidv4 } from 'uuid';

interface FileData {
  id: string;
  data: any[];
  filename: string;
  timestamp: string;
}

export default function AnamolyAutoFix() {
  const [fileData, setFileData] = useState<FileData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/upload", {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error('Failed to upload file');
      }

      const data = await response.json();
      console.log('Uploaded file data:', data); // Add logging
      const newFileData = {
        id: uuidv4(),
        data: data,
        filename: file.name,
        timestamp: new Date().toISOString(),
      };
      setFileData(newFileData);
      console.log('File data state set:', newFileData); // Add logging
    } catch (err) {
      console.error('Error uploading file:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative max-w-4xl mx-auto">
      {/* Add conditional rendering for debugging */}
      <div className="mb-8">
        <label
          className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer
            ${
              loading
                ? 'bg-gray-100 dark:bg-gray-800'
                : 'bg-gray-50 dark:bg-gray-900'
            }
            hover:bg-gray-100 dark:hover:bg-gray-800 border-gray-300 dark:border-gray-600`}
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Upload className="w-12 h-12 mb-4 text-gray-500 dark:text-gray-400 animate-bounce" />
            <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
              <span className="font-semibold">Click to upload</span> or drag and
              drop
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              CSV or Excel files
            </p>
          </div>
          <input
            type="file"
            className="hidden"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileUpload}
            disabled={loading}
          />
        </label>
      </div>

      {loading && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-30 flex items-center justify-center z-50">
          <div className="text-center text-white-600 dark:text-white-300">
            <div className="flex justify-center items-center space-x-2">
              <div className="w-4 h-4 rounded-full bg-blue-500 animate-pulse"></div>
              <div className="w-4 h-4 rounded-full bg-blue-500 animate-pulse delay-200"></div>
              <div className="w-4 h-4 rounded-full bg-blue-500 animate-pulse delay-400"></div>
            </div>
            <p>
              Processing your file...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="text-red-600 dark:text-red-400 text-center mb-4">
          {error}
        </div>
      )}

      {fileData ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-sm mb-4 text-gray-900 dark:text-white">
            Results from <span className='text-md font-semibold italic'>{fileData.filename}</span>
          </h3>
          <DataTable data={fileData.data} showRemediate={true} />
        </div>
      ) : (
        <div className="text-center text-gray-500 dark:text-gray-400">
          No file uploaded yet.
        </div>
      )}
    </div>
  );
}
