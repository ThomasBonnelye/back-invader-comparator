import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import userRoutes from './routes/userRoutes';
import { initDb } from './db';

const app = express();
const port = process.env.PORT ?? 3000;

app.use(cors());
app.use(bodyParser.json());

initDb();

app.use('/user', userRoutes);

app.listen(port, () => {
  console.log(`Backend sécurisé lancé sur http://localhost:${port}`);
});
