
import nodemailer from 'nodemailer';

interface EmailPayload {
    to: string;
    subject: string;
    html: string;
}

export const sendEmail = async (data: EmailPayload) => {
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    return await transporter.sendMail({
        from: `HSEFZ 校园墙 <${process.env.SMTP_USER}>`,
        ...data,
    });
};