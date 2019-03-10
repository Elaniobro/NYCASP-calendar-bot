require('dotenv').config();
const rp = require('request-promise');
const $ = require('cheerio');
const { google } = require('googleapis');
const moment = require('moment');

const key = {
  'type': process.env.TYPE,
  'project_id': process.env.PROJECT_ID,
  'private_key_id': process.env.PRIVATE_KEY_ID,
  'private_key': process.env.PRIVATE_KEY.replace(new RegExp('\\\\n', '\g'), '\n'),
  'client_email': process.env.CLIENT_EMAIL,
  'client_id': process.env.CLIENT_ID,
  'auth_uri': process.env.AUTH_URI,
  'token_uri': process.env.TOKEN_URI,
  'auth_provider_x509_cert_url': process.env.AUTH_PROVIDER_X509_CERT_URL,
  'client_x509_cert_url': process.env.CLIENT_X09_cert_url,
  'url': process.env.URL,
};
const scopes = ['https://www.googleapis.com/auth/calendar'];
const jwt = new google.auth.JWT(key.client_email, null, key.private_key, scopes)
const calendar = google.calendar('v3');

// process.env.GOOGLE_APPLICATION_CREDENTIALS = key

rp(key.url)
  .then((data) => {
    //success!
    const str = $('ol > li .tweet-text', data).first().text();
    const strRegex = /suspended/g;

    if (!str.match(strRegex)) return;

    const d = new Date();
    const dateRegex = /(January|February|March|April|May|June|July|August|September|October|November|December)\s[0-9]{1,2}/g;
    const tweet = str.match(dateRegex);
    const dateArr = tweet[0].split(' ');
    const month = moment().month(dateArr[0]).format('M');
    const day = dateArr[1];
    const fullDate = moment(new Date(`${d.getFullYear()}-${month}-${day}`)).format('YYYY-MM-DD');

    const event = {
      'summary': '🚙 NYCASP Suspended',
      'location': 'NY, NY',
      'description': 'Alternate side parking calendar',
      'start': {
        'date': `${fullDate}`,
      },
      'end': {
        'date': `${fullDate}`,
      },
      'attendees': [
        { 'email': 'eitrybuch@gmail.com' },
      ],
    };

    let jwtClient = new google.auth.JWT(
      key.client_email,
      null,
      key.private_key,
      ['https://www.googleapis.com/auth/calendar']);
    //authenticate request
    jwtClient.authorize(function (tokens) {
      calendar.events.insert({
        auth: jwt,
        calendarId: key.client_email,
        resource: event,
      }, (err, event) => {
        //handle error
        console.log('event:', event);

        if (err)
          console.log('There was an error contacting the Calendar service: ' + err);
      });
    });
  })
  .catch((err) => {
    //handle error
    console.log(err);
  });
