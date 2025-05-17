import ENV from "../config/config";
import nodemailer, { Transporter, SendMailOptions, SentMessageInfo } from "nodemailer";

class SMTP {
    private static instance: SMTP;
    private transporter: Transporter;

    private constructor() {
        this.transporter = nodemailer.createTransport({
            service: "Gmail",
            auth: {
                user: ENV.smtp_user,
                pass: ENV.smpt_pass,
            },
        });

        Object.freeze(this);
    }

    static getInstance(): SMTP {
        if (!SMTP.instance) {
            SMTP.instance = new SMTP();
        }
        return SMTP.instance;
    }

    sendMail(to: string, subject: string, text: string, html?: string): Promise<SentMessageInfo> {
        const mailOptions: SendMailOptions = {
            from: ENV.smtp_user,
            to,
            subject,
            text,
            html,
        };

        return this.transporter.sendMail(mailOptions);
    }
}

const smtpInstance: SMTP = SMTP.getInstance();
Object.freeze(smtpInstance);

export default smtpInstance;