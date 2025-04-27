import express, { Request, Response } from 'express';


const app = express();

app.use(express.json());

// Routes
app.use('/api/items',( req: Request, res: Response)=>{
    res.json({ message: 'Hello World!' });
} );

// Global error handler (should be after routes)
// app.use(errorHandler);

export default app;