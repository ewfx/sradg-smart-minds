import express from 'express';
import multer from 'multer';
import cors from 'cors';
import { parse } from 'csv-parse';
import * as XLSX from 'xlsx';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const upload = multer({ dest: 'uploads/' });

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../dist')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const fileExtension = req.file.originalname.split('.').pop().toLowerCase();
    let data;

    if (fileExtension === 'csv') {
      // Handle CSV file
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      data = await new Promise((resolve, reject) => {
        parse(fileContent, {
          columns: true,
          skip_empty_lines: true
        }, (err, records) => {
          if (err) reject(err);
          else resolve(records);
        });
      });
    } else if (['xlsx', 'xls'].includes(fileExtension)) {
      // Handle Excel file
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      data = XLSX.utils.sheet_to_json(worksheet);
    } else {
      throw new Error('Unsupported file format');
    }

    // Clean up uploaded file
    fs.unlinkSync(filePath);

    res.json(data);
  } catch (error) {
    console.error('Error processing file:', error);
    res.status(500).json({ error: error.code });
  }
});

app.post('/predict', async (req, res) => {
  try {
    const response = await axios.post('http://localhost:8000/predict', req.body, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error forwarding prediction request:', error);
    res.status(500).json({ error: 'Failed to get prediction' });
  }
});

app.post('/train', async (req, res) => {
  try {
    const response = await axios.post('http://localhost:8000/train_model', req.body, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error training model:', error);
    res.status(500).json({ error: 'Failed to train model' });
  }
});

app.post('/api/create-jira-ticket', async (req, res) => {
  const { rowData } = req.body;
  const jiraDetails = {
    url: process.env.REACT_APP_JIRA_URL,
    username: process.env.REACT_APP_JIRA_USERNAME,
    apiToken: process.env.REACT_APP_JIRA_API_TOKEN,
    projectKey: process.env.REACT_APP_JIRA_PROJECT_KEY,
  };

  if (!jiraDetails.url || !jiraDetails.username || !jiraDetails.apiToken || !jiraDetails.projectKey) {
    return res.status(400).json({ error: 'Jira details are not set in the environment variables' });
  }

  try {
    const response = await fetch(`${jiraDetails.url}/rest/api/2/issue`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${jiraDetails.username}:${jiraDetails.apiToken}`).toString('base64')}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fields: {
          project: { key: jiraDetails.projectKey },
          summary: `Anamoly Detection for ${rowData.id}`,
          description: JSON.stringify(rowData, null, 2),
          issuetype: { name: "Task" },
        },
      }),
    });

    const result = await response.json();
    if (response.ok) {
      res.json({ message: `Jira ticket created successfully! Ticket ID: ${result.key}. View it here: ${jiraDetails.url}/browse/${result.key}` });
    } else {
      res.status(500).json({ error: `Failed to create Jira ticket: ${result.errorMessages.join(", ")}` });
    }
  } catch (error) {
    res.status(500).json({ error: `Error creating Jira ticket: ${error.message}` });
  }
});

app.post('/api/send-email', async (req, res) => {
  const { rowData, recipientEmail } = req.body;
  const emailSettings = {
    smtpServer: process.env.REACT_APP_SMTP_SERVER,
    smtpPort: process.env.REACT_APP_SMTP_PORT,
    email: process.env.REACT_APP_EMAIL,
    password: process.env.REACT_APP_EMAIL_PASSWORD,
  };

  if (!emailSettings.smtpServer || !emailSettings.smtpPort || !emailSettings.email || !emailSettings.password) {
    return res.status(400).json({ error: 'Email settings are not set in the environment variables' });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: emailSettings.smtpServer,
      port: emailSettings.smtpPort,
      secure: emailSettings.smtpPort == 465, // true for 465, false for other ports
      auth: {
        user: emailSettings.email,
        pass: emailSettings.password,
      },
    });

    const mailOptions = {
      from: emailSettings.email,
      to: recipientEmail,
      subject: `!! Smart Reconciliation & Anomaly Detection Found !!`,
      text: JSON.stringify(rowData, null, 2),
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: "Email sent successfully!" });
  } catch (error) {
    res.status(500).json({ error: `Error sending email: ${error.message}` });
  }
});

// Handle unmatched routes
app.use((req, res) => {
  res.redirect('/');
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});