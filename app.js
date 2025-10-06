import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { port } from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

app.get('/', (req, res) => {
  res.render('index', { title: 'MoMo Payment (DB mapped)' });
});

import paymentsRouter from './routes/payments.js';
app.use('/payments', paymentsRouter);

app.listen(port, () => {
  console.log('Server running on port', port);
});
