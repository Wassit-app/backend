import dotenv from 'dotenv';

dotenv.config();

interface Config {
  port: number;
  nodeEnv: string;
  smpt_pass: string;
  smtp_user: string;
}

const config: Config = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  smpt_pass: process.env.SMTP_PASS || '',
  smtp_user: process.env.SMTP_USER || '',
};

export default config;