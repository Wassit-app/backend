import express, { Request, Response } from 'express';
import bodyParser from 'body-parser'
import cors from 'cors'
import helmet from 'helmet';
import AppRoutes from './routes/router'


const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(express.json());
app.use(helmet())

// Routes
app.use('/api/items',( req: Request, res: Response)=>{
    res.json({ message: 'Hello World!' });
});
app.use('/api', AppRoutes);


// Global error handler (should be after routes)
// app.use(errorHandler);

export default app;