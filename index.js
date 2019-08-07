import express from 'express';
import './cron';

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (res) => {
  res.send('Tweet');
});

app.listen(PORT, () => {
  console.log(`Example App running on port http://localhost:${PORT}`); /* eslint-disable-line */
});
