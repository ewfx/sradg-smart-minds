import React, { useState, useEffect } from 'react';
import { Upload } from 'lucide-react';
import DataTable from '../components/DataTable';
import { v4 as uuidv4 } from 'uuid';
import { openDB } from 'idb';

interface FileData {
  id: string;
  data: any[];
  filename: string;
  timestamp: string;
  lastUsed: string;
  reportedRows: { [key: string]: boolean };
}

const DB_NAME = 'AuditHistoryDB';
const STORE_NAME = 'auditHistory';

export default function FileUpload() {
  const [fileData, setFileData] = useState<FileData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;
  const trainingStatus = localStorage.getItem('trainingStatus') || 'not trained';

  useEffect(() => {
    const initDB = async () => {
      const db = await openDB(DB_NAME, 1, {
        upgrade(db) {
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          }
        },
      });
    };
    initDB();
  }, []);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
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
      const predictionResponse = await fetch("/predict", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!predictionResponse.ok) {
        const errorText = await predictionResponse.text();
        throw new Error('Failed to get prediction');
      }

      const predictionResponseData = await predictionResponse.json();
      const predictionData = predictionResponseData.results;
      const newFileData = {
        id: uuidv4(),
        data: predictionData,
        filename: file.name,
        timestamp: new Date().toISOString(),
        lastUsed: new Date().toISOString(),
        reportedRows: {},
      };
      setFileData(newFileData);

      // Save to IndexedDB
      const db = await openDB(DB_NAME, 1);
      await db.put(STORE_NAME, newFileData);
    } catch (err) {
      console.error('Error uploading file:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFileData(null);
    setError(null);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="relative max-w-4xl mx-auto">
      {trainingStatus === 'not trained' && (
        <div className="text-red-600 dark:text-red-400 text-center mb-4">
          Warning: Model training is not done. Please upload a training file in the settings.
        </div>
      )}
      {fileData ? (
        <div className="text-right mb-8 text-gray-500 dark:text-gray-400">
          Want to load new Data?
          <button
            onClick={handleReset}
            className="px-1 py-1 text-blue-500 underline dark:text-white-700 hover:font-semibold"
          >
            Upload file
          </button>
        </div>
      ) : (
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
      )}

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

      {fileData && (
        <>
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-gray-900 dark:text-gray-100">
              Page {currentPage} of {Math.ceil(fileData.data.length / rowsPerPage)}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === Math.ceil(fileData.data.length / rowsPerPage)}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-sm mb-4 text-gray-900 dark:text-white">
              Results from <span className='text-md font-semibold italic'>{fileData.filename}</span>
            </h3>
            <DataTable data={fileData.data} currentPage={currentPage} rowsPerPage={rowsPerPage} reportedRows={fileData.reportedRows} />
          </div>
          <div className="flex justify-between items-center mt-4">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-gray-900 dark:text-gray-100">
              Page {currentPage} of {Math.ceil(fileData.data.length / rowsPerPage)}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === Math.ceil(fileData.data.length / rowsPerPage)}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}
