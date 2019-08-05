import dotenv from 'dotenv';
import axios from 'axios';
import cheerio from 'cheerio';
import { google } from 'googleapis';
import moment from 'moment';

dotenv.config();
const  events = {};
events.exists = false;


const key = { // get all the secrets to use with the google api
  'type': process.env.TYPE,
  'project_id': process.env.PROJECT_ID,
  'private_key_id': process.env.PRIVATE_KEY_ID,
  'private_key': process.env.PRIVATE_KEY.replace(new RegExp('\\\\n', 'g'), '\n'),
  'client_email': process.env.CLIENT_EMAIL,
  'client_id': process.env.CLIENT_ID,
  'auth_uri': process.env.AUTH_URI,
  'token_uri': process.env.TOKEN_URI,
  'auth_provider_x509_cert_url': process.env.AUTH_PROVIDER_X509_CERT_URL,
  'client_x509_cert_url': process.env.CLIENT_X09_cert_url,
  'url': process.env.URL,
};
const scopes = ['https://www.googleapis.com/auth/calendar'];
const jwt = new google.auth.JWT(key.client_email, null, key.private_key, scopes);
const calendar = google.calendar('v3');

export async function getTweetNYCASP(html) {
  // load up cheerio
  const $ = cheerio.load(html);
  const str = $('ol > li .tweet-text').first().text();
  return str;
}

export async function getHTML(url) {
  const { data: html } = await axios.get(url);
  return html;
}

export async function getTweets() {
  const html = await getHTML(key.url);
  const tweetText = await getTweetNYCASP(html);
  return tweetText;
}

export async function runCron() {
  const str = await getTweets().catch((err) => console.warn(err));
  createEvent(str);
}

// Authenticate JSON Web Token with Google
function getJWTClient() {
  let jwtClient = new google.auth.JWT(
    key.client_email,
    null,
    key.private_key,
    ['https://www.googleapis.com/auth/calendar']
  );

  return jwtClient;
}

function getCalendarEventList(jwtClient, fullDate){
  const params = {
    auth: jwt,
    calendarId: key.client_email
  };

  jwtClient.authorize(() => {
    // Get list of all events
    calendar.events.list(params, (err, event) => {
      // Handle the events results here (response.result has the parsed body).

      // loop through and delete all events
      // event.data.items.forEach(item => deleteEvent(item.id));
      event.data.items.forEach((item, index) => { /* eslint-disable-line */
        if (item.start.date == fullDate)
          events.exists = true;
        // console.log({ index, fullDate, exists, date: item.start.date });
      });

      if (err)
        console.error('There was an error contacting the Calendar service: ' + err);
    });
  });

  return events.exists;
}

async function createEvent(str) {
  const strRegex = /suspended/g;

  if (!str.match(strRegex)) return;

  let jwtClient = getJWTClient();

  const d = new Date();
  const dateRegex = /(January|February|March|April|May|June|July|August|September|October|November|December)\s[0-9]{1,2}/g;
  const tweet = str.match(dateRegex);
  const dateArr = tweet[0].split(' ');
  const month = moment().month(dateArr[0]).format('M');
  const day = dateArr[1];
  const fullDate = moment(new Date(`${d.getFullYear()}-${month}-${day}`)).format('YYYY-MM-DD');
  const exists = await getCalendarEventList(jwtClient, fullDate);


  const event = {
    'summary': '🚙 NYCASP Suspended - TEST',
    'location': 'NY, NY',
    'description': 'Alternate side parking calendar - TEST',
    'start': {
      'date': `${fullDate}`,
      'timeZone': 'America/New_York'
    },
    'end': {
      'date': `${fullDate}`,
      'timeZone': 'America/New_York'
    },
    'transparency': 'opaque',
    'attendees': [
      { 'email': 'eitrybuch@gmail.com' },
    ],
  };

  // Authenticate request
  jwtClient.authorize(() => {
    // event for current tweet date exists, exit.
    if (exists !== true) {
      // Create and insert event
      calendar.events.insert({
        auth: jwt,
        calendarId: key.client_email,
        resource: event,
      }, (err, event) => {
        //handle error
        console.warn('event:', event);
        if (err)
          console.error('There was an error contacting the Calendar service: ' + err);
      });

      events.exists = true;
    }
  });
}



const deleteEvent = (eventId) => { /*eslint-disable-line */
  const params = {
    auth: jwt,
    calendarId: key.client_email,
    eventId: eventId,
  };

  calendar.events.delete(params, (err) => {
    if (err)
      throw new Error('The API returned an error: ' + err);

    console.warn('Event deleted.');
  });
};
