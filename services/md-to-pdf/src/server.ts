import express from 'express';
import type { Express, Request, Response } from 'express';
import { configDotenv } from 'dotenv';
import path from 'path';
import multer from 'multer';
import convertor from './controllers/convertor.js';
import cors from 'cors';

configDotenv(
    {path:path.resolve(process.cwd(), "./.env")}
);

const PORT = process.env.PORT || 3000;

const app: Express = express();

app.use(cors());

const upload = multer({ storage: multer.memoryStorage() });

app.get('/', (req: Request, res: Response)=>{
    return res.status(200).json(
        {
            "message":"md-to-pdf service is running"
        }
    );
});

app.post('/convert', upload.single('markdown'), convertor);

app.listen(PORT, ()=>console.log(`Server is running at port ${PORT}`))

