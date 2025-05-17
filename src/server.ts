import app from './app';
import config from './config/config';

const port = config.port || 3000;

app.listen(config.port, () => {
  console.log(`Server running on port ${port}`);
});