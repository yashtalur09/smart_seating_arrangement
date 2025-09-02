// import express from 'express';
// import multer from 'multer';
// import csvParser from 'csv-parser';
// import nodemailer from 'nodemailer';
// import cors from 'cors';
// import dotenv from 'dotenv';
// import fs from 'fs';
// import path from 'path';
// import { fileURLToPath } from 'url';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// dotenv.config();

// const app = express();
// const PORT = process.env.PORT || 5000;

// // Middleware
// app.use(cors({
//   origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
//   credentials: true
// }));
// app.use(express.json());
// app.use('/uploads', express.static('uploads'));

// // Ensure uploads directory exists
// const uploadsDir = 'uploads';
// if (!fs.existsSync(uploadsDir)) {
//   fs.mkdirSync(uploadsDir, { recursive: true });
// }

// // Configure multer for file uploads
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, uploadsDir);
//   },
//   filename: function (req, file, cb) {
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//     cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
//   }
// });

// const upload = multer({ 
//   storage: storage,
//   limits: {
//     fileSize: 10 * 1024 * 1024 // 10MB limit
//   },
//   fileFilter: function (req, file, cb) {
//     if (file.fieldname === 'csv') {
//       // Only allow CSV files for student list
//       if (file.mimetype === 'text/csv' || path.extname(file.originalname) === '.csv') {
//         cb(null, true);
//       } else {
//         cb(new Error('Only CSV files are allowed for student list'));
//       }
//     } else {
//       // Allow various file types for attachments
//       cb(null, true);
//     }
//   }
// });

// // Configure Gmail SMTP transporter
// const createTransporter = () => {
//   console.log('Creating Gmail transporter with user:', process.env.GMAIL_USER);
//   return nodemailer.createTransport({
//     host: process.env.SMTP_HOST || 'smtp.gmail.com',
//     port: parseInt(process.env.SMTP_PORT) || 587,
//     secure: false,
//     auth: {
//       user: process.env.GMAIL_USER,
//       pass: process.env.GMAIL_APP_PASSWORD
//     }
//   });
// };

// // Parse CSV file and extract email addresses
// const parseCSV = (filePath) => {
//   return new Promise((resolve, reject) => {
//     const emails = [];
//     const students = [];
    
//     fs.createReadStream(filePath)
//       .pipe(csvParser())
//       .on('data', (row) => {
//         // Look for email field (case insensitive)
//         const emailField = Object.keys(row).find(key => 
//           key.toLowerCase().includes('email') || 
//           key.toLowerCase().includes('mail')
//         );
        
//         if (emailField && row[emailField]) {
//           const email = row[emailField].trim();
//           if (email && email.includes('@')) {
//             emails.push(email);
//             students.push({
//               email: email,
//               name: row.name || row.Name || row.student_name || row['Student Name'] || 'Student',
//               ...row
//             });
//           }
//         }
//       })
//       .on('end', () => {
//         console.log(`Parsed CSV: Found ${emails.length} valid emails`);
//         resolve({ emails, students });
//       })
//       .on('error', (error) => {
//         console.error('CSV parsing error:', error);
//         reject(error);
//       });
//   });
// };

// // API Routes
// app.post('/api/upload-csv', upload.single('csv'), async (req, res) => {
//   try {
//     console.log('CSV upload request received');
//     if (!req.file) {
//       return res.status(400).json({ error: 'No CSV file uploaded' });
//     }

//     console.log('Processing CSV file:', req.file.originalname);
//     const { emails, students } = await parseCSV(req.file.path);
    
//     if (emails.length === 0) {
//       return res.status(400).json({ error: 'No valid email addresses found in CSV' });
//     }

//     res.json({
//       success: true,
//       message: `Found ${emails.length} valid email addresses`,
//       emailCount: emails.length,
//       students: students.slice(0, 5), // Return first 5 for preview
//       totalStudents: students.length,
//       filePath: req.file.path
//     });
//   } catch (error) {
//     console.error('Error processing CSV:', error);
//     res.status(500).json({ error: 'Failed to process CSV file: ' + error.message });
//   }
// });

// app.post('/api/upload-attachments', upload.array('attachments', 10), (req, res) => {
//   try {
//     console.log('Attachment upload request received');
//     if (!req.files || req.files.length === 0) {
//       return res.status(400).json({ error: 'No attachment files uploaded' });
//     }

//     const attachments = req.files.map(file => ({
//       filename: file.originalname,
//       path: file.path,
//       size: file.size
//     }));

//     console.log(`Uploaded ${attachments.length} attachments`);
//     res.json({
//       success: true,
//       message: `${attachments.length} attachment(s) uploaded successfully`,
//       attachments
//     });
//   } catch (error) {
//     console.error('Error uploading attachments:', error);
//     res.status(500).json({ error: 'Failed to upload attachment files: ' + error.message });
//   }
// });

// app.post('/api/send-emails', async (req, res) => {
//   try {
//     console.log('Send emails request received');
//     const { csvFilePath, attachmentPaths, subject, message } = req.body;

//     if (!csvFilePath) {
//       return res.status(400).json({ error: 'CSV file path is required' });
//     }

//     // Parse CSV to get student emails
//     const { emails, students } = await parseCSV(csvFilePath);

//     if (emails.length === 0) {
//       return res.status(400).json({ error: 'No valid email addresses found' });
//     }

//     // Check if Gmail credentials are configured
//     if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
//       return res.status(500).json({ 
//         error: 'Gmail SMTP credentials not configured. Please check .env file' 
//       });
//     }

//     console.log('Creating email transporter...');
//     const transporter = createTransporter();

//     // Test the connection
//     try {
//       await transporter.verify();
//       console.log('Gmail SMTP connection verified successfully');
//     } catch (verifyError) {
//       console.error('Gmail SMTP verification failed:', verifyError);
//       return res.status(500).json({ 
//         error: 'Gmail SMTP connection failed. Please check your credentials.' 
//       });
//     }

//     // Prepare attachments
//     const attachments = attachmentPaths ? attachmentPaths.map(filePath => ({
//       filename: path.basename(filePath),
//       path: filePath
//     })) : [];

//     let successCount = 0;
//     let failedEmails = [];

//     console.log(`Sending emails to ${students.length} students...`);

//     // Send emails to all students
//     for (const student of students) {
//       try {
//         const mailOptions = {
//           from: process.env.GMAIL_USER,
//           to: student.email,
//           subject: subject || 'Important Communication from School',
//           html: `
//             <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
//               <h2 style="color: #3B82F6;">Hello ${student.name},</h2>
//               <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
//                 ${message ? message.replace(/\n/g, '<br>') : 'Please find the attached documents.'}
//               </div>
//               <br>
//               <p style="color: #6b7280; font-size: 14px;">
//                 Best regards,<br>
//                 School Administration
//               </p>
//             </div>
//           `,
//           attachments
//         };

//         await transporter.sendMail(mailOptions);
//         successCount++;
//         console.log(`Email sent successfully to ${student.email}`);
//       } catch (error) {
//         console.error(`Failed to send email to ${student.email}:`, error);
//         failedEmails.push(student.email);
//       }
//     }

//     console.log(`Email sending completed. Success: ${successCount}, Failed: ${failedEmails.length}`);

//     res.json({
//       success: true,
//       message: `Emails sent successfully to ${successCount} out of ${students.length} students`,
//       successCount,
//       totalEmails: students.length,
//       failedEmails
//     });

//   } catch (error) {
//     console.error('Error sending emails:', error);
//     res.status(500).json({ error: 'Failed to send emails: ' + error.message });
//   }
// });

// // Health check endpoint
// app.get('/api/health', (req, res) => {
//   res.json({ 
//     status: 'OK', 
//     timestamp: new Date().toISOString(),
//     port: PORT,
//     gmail_configured: !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD)
//   });
// });

// // Error handling middleware
// app.use((error, req, res, next) => {
//   console.error('Server error:', error);
//   res.status(500).json({ error: error.message || 'Internal server error' });
// });

// app.listen(PORT, () => {
//   console.log(`🚀 Server running on port ${PORT}`);
//   console.log(`📧 Gmail user configured: ${process.env.GMAIL_USER}`);
//   console.log(`🔑 Gmail app password configured: ${process.env.GMAIL_APP_PASSWORD ? 'Yes' : 'No'}`);
//   console.log(`📁 Uploads directory: ${path.resolve(uploadsDir)}`);
// });


import express from 'express';
import multer from 'multer';
import csvParser from 'csv-parser';
import nodemailer from 'nodemailer';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
  credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Ensure uploads directory exists
const uploadsDir = 'uploads';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    if (file.fieldname === 'csv') {
      // Only allow CSV files for student list
      if (file.mimetype === 'text/csv' || path.extname(file.originalname) === '.csv') {
        cb(null, true);
      } else {
        cb(new Error('Only CSV files are allowed for student list'));
      }
    } else {
      // Allow various file types for attachments
      cb(null, true);
    }
  }
});

// Configure Gmail SMTP transporter
const createTransporter = () => {
  console.log('Creating Gmail transporter with user:', process.env.GMAIL_USER);
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD
    }
  });
};

// Parse CSV file and extract email addresses
const parseCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    const emails = [];
    const students = [];
    
    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on('data', (row) => {
        // Look for email field (case insensitive)
        const emailField = Object.keys(row).find(key => 
          key.toLowerCase().includes('email') || 
          key.toLowerCase().includes('mail')
        );
        
        if (emailField && row[emailField]) {
          const email = row[emailField].trim();
          if (email && email.includes('@')) {
            emails.push(email);
            students.push({
              email: email,
              name: row.name || row.Name || row.student_name || row['Student Name'] || 'Student',
              ...row
            });
          }
        }
      })
      .on('end', () => {
        console.log(`Parsed CSV: Found ${emails.length} valid emails`);
        resolve({ emails, students });
      })
      .on('error', (error) => {
        console.error('CSV parsing error:', error);
        reject(error);
      });
  });
};

// API Routes
app.post('/api/upload-csv', upload.single('csv'), async (req, res) => {
  try {
    console.log('CSV upload request received');
    if (!req.file) {
      return res.status(400).json({ error: 'No CSV file uploaded' });
    }

    console.log('Processing CSV file:', req.file.originalname);
    const { emails, students } = await parseCSV(req.file.path);
    
    if (emails.length === 0) {
      return res.status(400).json({ error: 'No valid email addresses found in CSV' });
    }

    res.json({
      success: true,
      message: `Found ${emails.length} valid email addresses`,
      emailCount: emails.length,
      students: students.slice(0, 5), // Return first 5 for preview
      totalStudents: students.length,
      filePath: req.file.path
    });
  } catch (error) {
    console.error('Error processing CSV:', error);
    res.status(500).json({ error: 'Failed to process CSV file: ' + error.message });
  }
});

app.post('/api/upload-attachments', upload.array('attachments', 10), (req, res) => {
  try {
    console.log('Attachment upload request received');
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No attachment files uploaded' });
    }

    const attachments = req.files.map(file => ({
      filename: file.originalname,
      path: file.path,
      size: file.size
    }));

    console.log(`Uploaded ${attachments.length} attachments`);
    res.json({
      success: true,
      message: `${attachments.length} attachment(s) uploaded successfully`,
      attachments
    });
  } catch (error) {
    console.error('Error uploading attachments:', error);
    res.status(500).json({ error: 'Failed to upload attachment files: ' + error.message });
  }
});

app.post('/api/send-emails', async (req, res) => {
  try {
    console.log('Send emails request received');
    const { csvFilePath, attachmentPaths, subject, message } = req.body;

    if (!csvFilePath) {
      return res.status(400).json({ error: 'CSV file path is required' });
    }

    // Parse CSV to get student emails
    const { emails, students } = await parseCSV(csvFilePath);

    if (emails.length === 0) {
      return res.status(400).json({ error: 'No valid email addresses found' });
    }

    // Check if Gmail credentials are configured
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      return res.status(500).json({ 
        error: 'Gmail SMTP credentials not configured. Please check .env file' 
      });
    }

    console.log('Creating email transporter...');
    const transporter = createTransporter();

    // Test the connection
    try {
      await transporter.verify();
      console.log('Gmail SMTP connection verified successfully');
    } catch (verifyError) {
      console.error('Gmail SMTP verification failed:', verifyError);
      return res.status(500).json({ 
        error: 'Gmail SMTP connection failed. Please check your credentials.' 
      });
    }

    // Prepare attachments
    const attachments = attachmentPaths ? attachmentPaths.map(filePath => ({
      filename: path.basename(filePath),
      path: filePath
    })) : [];

    let successCount = 0;
    let failedEmails = [];

    console.log(`Sending emails to ${students.length} students...`);

    // Send emails to all students
    for (const student of students) {
      try {
        const mailOptions = {
          from: `"College Admin" <${process.env.GMAIL_USER}>`,
          to: student.email,
          subject: subject || 'Important Communication from School',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #3B82F6;">Hello ${student.name},</h2>
              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
                ${message ? message.replace(/\n/g, '<br>') : 'Please find the attached documents.'}
              </div>
              <br>
              <p style="color: #6b7280; font-size: 14px;">
                Best regards,<br>
                College Administration
              </p>
            </div>
          `,
          attachments
        };

        await transporter.sendMail(mailOptions);
        successCount++;
        console.log(`Email sent successfully to ${student.email}`);
      } catch (error) {
        console.error(`Failed to send email to ${student.email}:`, error);
        failedEmails.push(student.email);
      }
    }

    console.log(`Email sending completed. Success: ${successCount}, Failed: ${failedEmails.length}`);

    res.json({
      success: true,
      message: `Emails sent successfully to ${successCount} out of ${students.length} students`,
      successCount,
      totalEmails: students.length,
      failedEmails
    });

  } catch (error) {
    console.error('Error sending emails:', error);
    res.status(500).json({ error: 'Failed to send emails: ' + error.message });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    port: PORT,
    gmail_configured: !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD)
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ error: error.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📧 Gmail user configured: ${process.env.GMAIL_USER}`);
  console.log(`🔑 Gmail app password configured: ${process.env.GMAIL_APP_PASSWORD ? 'Yes' : 'No'}`);
  console.log(`📁 Uploads directory: ${path.resolve(uploadsDir)}`);
});