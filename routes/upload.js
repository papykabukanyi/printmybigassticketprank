const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const fileFilter = (req, file, cb) => {
    // Allow only image files
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed'), false);
    }
};

const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter
});

// Upload boarding pass image
router.post('/boarding-pass', authMiddleware, upload.single('boardingPass'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const fileData = {
            userId: req.user.id,
            originalName: req.file.originalname,
            filename: req.file.filename,
            path: req.file.path,
            size: req.file.size,
            mimetype: req.file.mimetype,
            uploadedAt: new Date().toISOString()
        };

        const fileId = await db.saveUploadedFile(fileData);

        res.json({
            fileId,
            filename: req.file.filename,
            originalName: req.file.originalname,
            size: req.file.size,
            url: `/uploads/${req.file.filename}`
        });
    } catch (error) {
        console.error('File upload error:', error);
        
        // Clean up uploaded file if there was an error
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        
        res.status(500).json({ error: 'File upload failed' });
    }
});

// Get uploaded file info
router.get('/file/:fileId', authMiddleware, async (req, res) => {
    try {
        const file = await db.getUploadedFile(req.params.fileId);
        
        if (!file || file.userId !== req.user.id) {
            return res.status(404).json({ error: 'File not found' });
        }

        res.json({
            fileId: file.id,
            originalName: file.originalName,
            filename: file.filename,
            size: file.size,
            uploadedAt: file.uploadedAt,
            url: `/uploads/${file.filename}`
        });
    } catch (error) {
        console.error('File fetch error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete uploaded file
router.delete('/file/:fileId', authMiddleware, async (req, res) => {
    try {
        const file = await db.getUploadedFile(req.params.fileId);
        
        if (!file || file.userId !== req.user.id) {
            return res.status(404).json({ error: 'File not found' });
        }

        // Delete physical file
        if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
        }

        // Remove from database (in a real Redis setup, you'd use DEL command)
        // For now, we'll just mark it as deleted
        await db.redis.hset(req.params.fileId, 'deleted', 'true');

        res.json({ message: 'File deleted successfully' });
    } catch (error) {
        console.error('File deletion error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Error handling middleware for multer
router.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
        }
    }
    
    if (error.message === 'Only image files are allowed') {
        return res.status(400).json({ error: 'Only image files are allowed' });
    }
    
    res.status(500).json({ error: 'Upload failed' });
});

module.exports = router;
