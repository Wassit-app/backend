import dotenv from 'dotenv';

dotenv.config();

interface Config {
  port: number;
  nodeEnv: string;
  smpt_pass: string;
  smtp_user: string;
  jwt_secret?: string;
}

const config: Config = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  smpt_pass: process.env.SMTP_PASS || '',
  smtp_user: process.env.SMTP_USER || '',
  jwt_secret: process.env.JWT_SECRET,
};

export default config;