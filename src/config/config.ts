import dotenv from 'dotenv';

dotenv.config();

interface Config {
  port: number;
  nodeEnv: string;
  smpt_pass: string;
  smtp_user: string;
  jwt_secret?: string;
  google_client_id?: string;
  google_client_secret?: string;
  google_callback_url?: string;
  frontend: {
    url: string;
    authSuccessPath: string;
  };
}

const config: Config = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  smpt_pass: process.env.SMTP_PASS || '',
  smtp_user: process.env.SMTP_USER || '',
  jwt_secret: process.env.JWT_SECRET,
  google_client_id: process.env.GOOGLE_CLIENT_ID,
  google_client_secret: process.env.GOOGLE_CLIENT_SECRET,
  google_callback_url: process.env.GOOGLE_CALLBACK_URL,
  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:3000',
    authSuccessPath: '/auth/success'
  },
};

export default config;