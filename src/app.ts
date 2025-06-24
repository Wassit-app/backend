import express, { Request, Response } from 'express';
import bodyParser from 'body-parser'
import cors from 'cors'
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import AppRoutes from './routes/router'
import passport from 'passport';
import logger from './utils/logger';
import { errorHandler } from './middlewares/errorHandler';


const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
// app.use(passport.initialize());
// app.use(passport.session());
app.use(cookieParser());
app.use(bodyParser.json());
app.use(express.json());
app.use(helmet())

app.use((req, res, next) => {
  logger.info(`Received ${req.method} request to ${req.url}`);
  logger.info(`Request body: ${req.body}`);
  next();
});



// Routes
app.use('/api', AppRoutes);

app.use(errorHandler);  
// Global error handler (should be after routes)
// app.use(errorHandler);

export default app;