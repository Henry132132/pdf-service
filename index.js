import express from 'express';
import multer from 'multer';
import { PDFDocument, degrees } from 'pdf-lib';
import fs from 'fs';

const upload = multer();
const app = express();
const PORT = process.env.PORT || 8080;

// DIN-Lang (210 × 105 mm) → Punkte
const DL_W = 210 / 25.4 * 72;
const DL_H = 105 / 25.4 * 72;

app.post('/resize', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).send('file missing');

    const origDoc = await PDFDocument.load(req.file.buffer);
    const newDoc  = await PDFDocument.create();
    const newPage = newDoc.addPage([DL_W, DL_H]);

    const orig = origDoc.getPage(0);
    const emb  = await newDoc.embedPage(orig);

    const x = (DL_W - emb.height) / 2 + 520;
    const y = (DL_H - emb.width)  / 2;

    newPage.drawPage(emb, { x, y, rotate: degrees(90) });
    const bytes = await newDoc.save();

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename=label-dl.pdf'
    });
    res.send(Buffer.from(bytes));
  } catch (e) { res.status(500).send(e.toString()); }
});

app.get('/', (req, res)=>res.send('PDF service online'));
app.listen(PORT, ()=>console.log('PDF service on', PORT));
