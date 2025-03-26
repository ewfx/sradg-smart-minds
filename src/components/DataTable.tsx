import React, { Fragment, useState } from "react";
import {
  MessageSquareWarning,
  Ticket,
  Clipboard,
  Mail,
  CheckCircle,
} from "lucide-react";
// import nodemailer from 'nodemailer';

interface DataTableProps {
  data: Array<{ [key: string]: any }>;
  currentPage?: number;
  rowsPerPage?: number;
  reportedRows?: { [key: string]: boolean };
  showRemediate?: boolean;
}

const DataTable: React.FC<DataTableProps> = ({
  data,
  currentPage = 1,
  rowsPerPage = 10,
  reportedRows = {},
  showRemediate = false,
}) => {
  const columns = data.length > 0 ? Object.keys(data[0]) : [];

  const paginatedData = data.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const [message, setMessage] = useState("");

  const jiraEnabled = JSON.parse(
    localStorage.getItem("jiraEnabled") || "false"
  );
  const recipientEmail = localStorage.getItem("recipientEmail") || "";

  const handleCreateJiraTicket = async (rowData: { [key: string]: any }) => {
    try {
      const response = await fetch("/api/create-jira-ticket", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rowData }),
      });

      const result = await response.json();
      if (response.ok) {
        setMessage(result.message);
      } else {
        setMessage(`Failed to create Jira ticket: ${result.error}`);
      }
    } catch (error) {
      setMessage(`Error creating Jira ticket: ${error.message}`);
    }
  };

  const handleSendEmail = async (rowData: { [key: string]: any }) => {
    try {
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rowData, recipientEmail }),
      });

      const result = await response.json();
      if (response.ok) {
        setMessage(result.message);
      } else {
        setMessage(`Failed to send email: ${result.error}`);
      }
    } catch (error) {
      setMessage(`Error sending email: ${error.message}`);
    }
  };

  const handleCopyToClipboard = (rowData: { [key: string]: any }) => {
    navigator.clipboard
      .writeText(JSON.stringify(rowData, null, 2))
      .then(() => {
        setMessage("Row data copied to clipboard!");
      })
      .catch((error) => {
        setMessage(`Error copying to clipboard: ${error.message}`);
      });
  };

  const handleReportFalsePositive = async (rowData: { [key: string]: any }) => {
    try {
      const response = await fetch("/train", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...rowData, anamoly: 1 }),
      });

      if (!response.ok) {
        throw new Error("Failed to report false positive");
      }

      const updatedReportedRows = { ...reportedRows, [rowData.id]: true };
      localStorage.setItem("reportedRows", JSON.stringify(updatedReportedRows));
      setMessage("Reported false positive successfully!");
    } catch (error) {
      setMessage(`Error reporting false positive: ${error.message}`);
    }
  };

  const handleRemediate = async (rowData: { [key: string]: any }) => {
    try {
      const response = await fetch("/api/remediate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(rowData),
      });

      if (!response.ok) {
        throw new Error("Failed to remediate");
      }

      setMessage("Remediation successful!");
    } catch (error) {
      setMessage(`Error remediating: ${error.message}`);
    }
  };

  return (
    <div className="overflow-x-auto">
      {message && (
        <div className="mb-4 p-4 bg-blue-100 text-blue-800 rounded">
          {message}
        </div>
      )}
      <table className="min-w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700">
        <thead className="bg-gray-100 dark:bg-gray-700">
          <tr>
            <th className="px-4 py-2 border-b border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100">
              #
            </th>
            {columns.map((col) => (
              <th
                key={col}
                className="px-4 py-2 border-b border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100"
              >
                {col}
              </th>
            ))}
            { !showRemediate && <th className="px-4 py-2 border-b border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100">
              Feedback
            </th> }
            <th className="px-4 py-2 border-b border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {paginatedData.map((row, index) => (
            <tr key={index} className={`even:bg-gray-50 dark:even:bg-gray-900`}>
              <td className="border px-4 py-2 text-gray-900 dark:text-gray-100">
                {(currentPage - 1) * rowsPerPage + index + 1}
              </td>
              {columns.map((col) => (
                <td
                  key={col}
                  className="border px-4 py-2 truncate max-w-xs text-gray-900 dark:text-gray-100"
                  title={row[col]}
                >
                  {row[col]}
                </td>
              ))}
              <td className="border px-4 py-2 justify-center">
                <div className="flex space-x-2">
                  {!showRemediate && reportedRows[row.id] ? (
                    <span className="text-green-500 dark:text-green-400">
                      Reported false
                    </span>
                  ) : (
                    <div className="relative group">
                      <MessageSquareWarning
                        className="cursor-pointer text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900 rounded"
                        onClick={() => handleReportFalsePositive(row)}
                      />Report False Positive
                    </div>
                  )}
                </div>
              </td>
              <td className="border px-4 py-2 justify-center">
                <div className="flex space-x-2">
                  {showRemediate ? (
                    <div className="relative group">
                      <CheckCircle
                        className="cursor-pointer text-green-500 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900 rounded"
                        onClick={() => handleRemediate(row)}
                      /> Fix Data
                    </div>
                  ) : (
                    <Fragment>
                      <div className="relative group">
                        <Ticket
                          className={`cursor-pointer text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-900 rounded ${
                            !jiraEnabled ? "opacity-50 cursor-not-allowed" : ""
                          }`}
                          onClick={() =>
                            jiraEnabled && handleCreateJiraTicket(row)
                          }
                        />
                        <span className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-max px-2 py-1 text-xs text-white bg-black rounded opacity-0 group-hover:opacity-100 transition-opacity z-50">
                          {jiraEnabled
                            ? "Create Ticket"
                            : "JIRA Workflow is disabled in preferences"}
                        </span>
                      </div>
                      <div className="relative group">
                        <Clipboard
                          className="cursor-pointer text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-900 rounded"
                          onClick={() => handleCopyToClipboard(row)}
                        />
                        <span className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-max px-2 py-1 text-xs text-white bg-black rounded opacity-0 group-hover:opacity-100 transition-opacity z-50">
                          Copy to Clipboard
                        </span>
                      </div>
                      <div className="relative group">
                        <Mail
                          className={`cursor-pointer text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-900 rounded ${
                            !recipientEmail
                              ? "opacity-50 cursor-not-allowed"
                              : ""
                          }`}
                          onClick={() => recipientEmail && handleSendEmail(row)}
                        />
                        <span className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-max px-2 py-1 text-xs text-white bg-black rounded opacity-0 group-hover:opacity-100 transition-opacity z-50">
                          {recipientEmail
                            ? "Send Email"
                            : "Recipient address not available in preferences"}
                        </span>
                      </div>
                    </Fragment>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;
