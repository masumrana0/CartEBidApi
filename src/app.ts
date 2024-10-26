/**
 * Title: 'Application'
 * Description: ''
 * Author: 'Masum Rana'
 * Date: 27-12-2023
 *
 */

import express, { Application } from 'express';
import cors from 'cors';
import GlobalErrorHandler from './app/middlewares/GlobalErrorHanlder';
import handleNotFoundApi from './errors/handleNotFound';
import router from './app/routes';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import config from './config';

const app: Application = express();

app.use(
  cors({
    origin: ['https://www.freeflexiplan.com', 'http://localhost:3000'],
    credentials: true,
  }),
);

// Passport configuration
passport.use(
  new GoogleStrategy(
    {
      clientID: config.google.client_id as string,
      clientSecret: config.google.client_secret as string,
      callbackURL: config.google.callback_url as string,
    },
    (accessToken, refreshToken, profile, done) => {
      // You should save the user profile to your database here
      return done(null, profile);
    },
  ),
);

app.use(cookieParser());

app.get('/', (req, res) => {
  res.send('Server Working successfully');
});
//parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// route
app.use('/api/v1', router);
// Global Error handler
app.use(GlobalErrorHandler);

// handle not found api/ route
app.use(handleNotFoundApi);

export default app;
