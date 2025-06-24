import app from './app';
import config from './config/config';
import dotenv from 'dotenv';

dotenv.config();


const PORT: string = process.env.PORT || "3000";

app.listen(config.port, () => {
  console.log(`Server running on port ${PORT}`);
});