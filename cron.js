import cron from 'node-cron';
import { runCron } from './scraper';

// every 10 seconds: '*/10 * * * * *'
cron.schedule('0 * * * * *', () => { // every hour
  console.log('⏲️ RUNNING THE CRON'); /*eslint-disable-line*/
  runCron();
});
