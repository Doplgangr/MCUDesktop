import request from "request-promise";
import cheerio from "cheerio";
import Backend from './api';
import React from "react";
import fs from 'fs';
import readline from 'readline';
import google from 'googleapis';
import googleAuth from 'google-auth-library';
import shell from 'shell';
let browserWindow = require('remote').require('browser-window');

// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/calendar-nodejs-quickstart.json
var SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];
var TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH ||
    process.env.USERPROFILE) + '/.credentials/';
var TOKEN_PATH = TOKEN_DIR + 'calendar-nodejs-quickstart.json';

let context;
export default class Dashboard extends Backend{    

  
    constructor(props) {
        super(props);
        this.state = {
            hasdata: null,
            data: null,
        };
        context = this;
    }

    render(){
        return(
            
      <div className="ui raised very padded text container segment">
            <div className="ui relaxed divided list">
            {
                !this.state.hasdata ?
                this.grab() : 
                this.renderdata()
            }
            </div>
            </div>
            
        );
    }
    
    renderdata(){
        return this.state.data.map((display) => (
            <div className="item">
                <div className="content">
                    <p>{display}</p>
                </div>
            </div>
        ));
    }
    grab(){
        this.loginwithHiddenParams().then(
                function(body){
                    console.log("Hi there");
                    return context.requestMainPage();                
                })
            .then((display) => {        
            context.setState({
                hasdata: true,
                data: display
            });
        });
        context.grabGoogleAPI();
    }
grabGoogleAPI(){
      // Load client secrets from a local file.
    fs.readFile('app/api/client_secret.json', function processClientSecrets(err, content) {
    if (err) {
        console.log('Error loading client secret file: ' + err);
        return;
    }
    // Authorize a client with the loaded credentials, then call the
    // Google Calendar API.
    context.authorize(JSON.parse(content), context.listEvents);
    });
}    
/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
authorize(credentials, callback) {
  var clientSecret = credentials.installed.client_secret;
  var clientId = credentials.installed.client_id;
  var redirectUrl = credentials.installed.redirect_uris[0];
  var auth = new googleAuth();
  var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, function(err, token) {
    if (err) {
      context.getNewToken(oauth2Client, callback);
    } else {
      oauth2Client.credentials = JSON.parse(token);
      callback(oauth2Client);
    }
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback to call with the authorized
 *     client.
 */
getNewToken(oauth2Client, callback) {
  var authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES
  });
  console.log('Authorize this app by visiting this url: ', authUrl);
  
  let win = new browserWindow({width: 800, height: 600});
  win.loadUrl(authUrl);
  let webContents = win.webContents;
  webContents.on('will-navigate', function(event, url) {
    console.log('Navigating to', url);
    if (url.startsWith("http://localhost/?code=")){
      let code = url.split("http://localhost/?code=")[1];
      console.log('code is ', code);
      win.close();
      oauth2Client.getToken(code, function(err, token) {
        if (err) {
          console.log('Error while trying to retrieve access token', err);
          return;
        }
        oauth2Client.credentials = token;
        context.storeToken(token);
        callback(oauth2Client);
      });
    }
  // TODO: handle the url
  });
}

/**
 * Store token to disk be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */
storeToken(token) {
  try {
    fs.mkdirSync(TOKEN_DIR);
  } catch (err) {
    if (err.code != 'EEXIST') {
      throw err;
    }
  }
  fs.writeFile(TOKEN_PATH, JSON.stringify(token));
  console.log('Token stored to ' + TOKEN_PATH);
}
removeToken(){
  fs.unlinkSync(TOKEN_PATH);
}

/**
 * Lists the next 10 events on the user's primary calendar.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
listEvents(auth) {
  var calendar = google.calendar('v3');
  calendar.events.list({
    auth: auth,
    calendarId: 'primary',
    timeMin: (new Date()).toISOString(),
    maxResults: 10,
    singleEvents: true,
    orderBy: 'startTime'
  }, function(err, response) {
    if (err) {
      console.log(err.message);
      switch(err.message){
        case "invalid_grant":
          context.removeToken(); 
          context.grabGoogleAPI();
      }      
      return;
    }
    var events = response.items;
    if (events.length == 0) {
      console.log('No upcoming events found.');
    } else {
      console.log('Upcoming 10 events:');
      for (var i = 0; i < events.length; i++) {
        var event = events[i];
        var start = event.start.dateTime || event.start.date;
        console.log('%s - %s', start, event.summary);
      }
    }
  });
}


}