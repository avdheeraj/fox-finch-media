const express = require('express');
const session = require('express-session');
const multer = require('multer');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'content.json');
const UPLOADS_DIR = path.join(__dirname, 'uploads');

// ---- Admin credentials ----
// Change this password before deploying. Default: "admin123"
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD_HASH = bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'admin123', 8);

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'change-this-secret-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 8 } // 8 hours
}));

// Serve uploaded videos and the public site
app.use('/uploads', express.static(UPLOADS_DIR));
app.use(express.static(path.join(__dirname, 'public')));

// ---- Helpers ----
function readContent() {
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
}
function writeContent(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}
function requireAuth(req, res, next) {
  if (req.session && req.session.loggedIn) return next();
  return res.status(401).json({ error: 'Not authenticated' });
}

// ---- Multer setup for video uploads ----
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const safeName = crypto.randomBytes(8).toString('hex') + ext;
    cb(null, safeName);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB max
  fileFilter: (req, file, cb) => {
    const allowed = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only video files (mp4, webm, mov, mkv) are allowed'));
  }
});

// ---- Auth routes ----
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USERNAME && bcrypt.compareSync(password || '', ADMIN_PASSWORD_HASH)) {
    req.session.loggedIn = true;
    return res.json({ success: true });
  }
  res.status(401).json({ error: 'Invalid username or password' });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => res.json({ success: true }));
});

app.get('/api/me', (req, res) => {
  res.json({ loggedIn: !!(req.session && req.session.loggedIn) });
});

// ---- Public content route ----
app.get('/api/content', (req, res) => {
  res.json(readContent());
});

// ---- Protected: update general content (studio, contact, services, team, testimonials) ----
app.put('/api/content', requireAuth, (req, res) => {
  const current = readContent();
  const updated = { ...current, ...req.body, videos: current.videos }; // videos managed separately
  writeContent(updated);
  res.json({ success: true, content: updated });
});

// ---- Protected: video upload ----
app.post('/api/videos', requireAuth, upload.single('video'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No video file uploaded' });
  const content = readContent();
  const newVideo = {
    id: crypto.randomBytes(6).toString('hex'),
    filename: req.file.filename,
    url: `/uploads/${req.file.filename}`,
    title: req.body.title || 'Untitled video',
    tag: req.body.tag || 'Video',
    description: req.body.description || '',
    duration: req.body.duration || ''
  };
  content.videos.push(newVideo);
  writeContent(content);
  res.json({ success: true, video: newVideo });
});

// ---- Protected: update video metadata ----
app.put('/api/videos/:id', requireAuth, (req, res) => {
  const content = readContent();
  const video = content.videos.find(v => v.id === req.params.id);
  if (!video) return res.status(404).json({ error: 'Video not found' });
  Object.assign(video, {
    title: req.body.title ?? video.title,
    tag: req.body.tag ?? video.tag,
    description: req.body.description ?? video.description,
    duration: req.body.duration ?? video.duration
  });
  writeContent(content);
  res.json({ success: true, video });
});

// ---- Protected: delete video ----
app.delete('/api/videos/:id', requireAuth, (req, res) => {
  const content = readContent();
  const idx = content.videos.findIndex(v => v.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Video not found' });
  const [removed] = content.videos.splice(idx, 1);
  const filePath = path.join(UPLOADS_DIR, removed.filename);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  writeContent(content);
  res.json({ success: true });
});

// Error handler (e.g. multer file-too-large / wrong type)
app.use((err, req, res, next) => {
  if (err) return res.status(400).json({ error: err.message });
  next();
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Admin panel: http://localhost:${PORT}/admin.html`);
  console.log(`Default login -> username: ${ADMIN_USERNAME} / password: ${process.env.ADMIN_PASSWORD || 'admin123'} (change via env vars)`);
});
