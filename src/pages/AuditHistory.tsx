import React, { useEffect, useState } from 'react';
import { Edit, Trash } from 'lucide-react';
import DataTable from '../components/DataTable';
import { openDB } from 'idb';

interface FileData {
  id: string;
  data: any[];
  filename: string;
  timestamp: string;
  lastUsed: string;
}

const DB_NAME = 'AuditHistoryDB';
const STORE_NAME = 'auditHistory';

export default function AuditHistory() {
  const [auditData, setAuditData] = useState<FileData[]>([]);
  const [selectedFileData, setSelectedFileData] = useState<FileData | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const db = await openDB(DB_NAME, 1);
      const allData = await db.getAll(STORE_NAME);
      setAuditData(allData);
    };
    fetchData();
  }, []);

  const handleFileClick = (fileData: FileData) => {
    setSelectedFileData(fileData);
    updateLastUsed(fileData);
  };

  const handleDelete = async (id: string) => {
    const db = await openDB(DB_NAME, 1);
    await db.delete(STORE_NAME, id);
    const updatedData = auditData.filter((data) => data.id !== id);
    setAuditData(updatedData);
  };

  const updateLastUsed = async (fileData: FileData) => {
    const db = await openDB(DB_NAME, 1);
    const updatedFileData = { ...fileData, lastUsed: new Date().toISOString() };
    await db.put(STORE_NAME, updatedFileData);
    const updatedData = auditData.map((data) =>
      data.id === fileData.id ? updatedFileData : data
    );
    setAuditData(updatedData);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Audit History</h2>
        {selectedFileData && (
          <button
            onClick={() => setSelectedFileData(null)}
            className="text-blue-500 dark:text-blue-400 hover:underline"
          >
            Back to Audit History
          </button>
        )}
      </div>
      {selectedFileData ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            Results from {selectedFileData.filename}
          </h3>
          <DataTable data={selectedFileData.data} currentPage={1} rowsPerPage={10} />
        </div>
      ) : (
        <div>
          {auditData.length === 0 ? (
            <p className="text-gray-900 dark:text-gray-100">No previous upload sessions found.</p>
          ) : (
            <ul className="space-y-4">
              {auditData.map((fileData) => (
                <li
                  key={fileData.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex justify-between items-center hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {fileData.filename}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Uploaded: {new Date(fileData.timestamp).toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Last Used: {new Date(fileData.lastUsed).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFileClick(fileData);
                      }}
                      className="text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-600"
                    >
                      <Edit size={20} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(fileData.id);
                      }}
                      className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-600"
                    >
                      <Trash size={20} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
