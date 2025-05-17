import { COMPANY_ADDRESS, COMPANY_NAME } from "../constants/company.const";
import SMTPUtil from "../utils/smtp.util";
import ENV from "../config/config";
import path from "node:path";
import fs from "node:fs";

class SMTPService {
    public static year = new Date().getFullYear();

    private static async sendTemplatedEmail(
        email: string,
        user: string,
        otp: string,
        templatePath: string,
        subject: string,
        text: string
    ): Promise<void> {
        if (ENV.nodeEnv === "test") return;

        let HTML = fs.readFileSync(templatePath, "utf-8");
        const date = new Date().toLocaleDateString("en-GB", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });

        HTML = HTML.replace(/{{otp}}/g, otp)
            .replace(/{{company}}/g, COMPANY_NAME)
            .replace(/{{address}}/g, COMPANY_ADDRESS)
            .replace(/{{date}}/g, date)
            .replace(/{{user_name}}/g, user)
            .replace(/{{year}}/g, this.year.toString());

        return await SMTPUtil.sendMail(email, subject, text, HTML);
    }

    public static async sendAppOTPEmail(email: string, user: string, otp: string): Promise<void> {
        const templatePath = path.join("./templates/authOtp.html");
        const subject = `Your OTP for ${COMPANY_NAME} App`;
        const text = `Your OTP for ${COMPANY_NAME} App is ${otp}`;

        return this.sendTemplatedEmail(email, user, otp, templatePath, subject, text);
    }

    public static async sendAppOTPPasswordReset(
        email: string,
        user: string,
        otp: string
    ): Promise<void> {
        const templatePath = path.join("./templates/forgetPasswordOtp.html");
        const subject = `Password Reset OTP for ${COMPANY_NAME} App`;
        const text = `Your password reset OTP for ${COMPANY_NAME} App is ${otp}`;
        return this.sendTemplatedEmail(email, user, otp, templatePath, subject, text);
    }
}

export default SMTPService;