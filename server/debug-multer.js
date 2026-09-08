const express = require('express');
const multer = require('multer');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.post('/test', upload.single('resume'), (req, res) => {
  res.json({
    hasBody: !!req.body,
    bodyType: typeof req.body,
    bodyKeys: Object.keys(req.body || {}),
    bodyStr: JSON.stringify(req.body),
    hasFile: !!req.file,
    fileExt: req.file ? req.file.mimetype : "none"
  });
});

app.listen(3005, () => console.log('Listening 3005'));
