// lib/email.ts
import nodemailer from 'nodemailer';

interface EmailPayload {
    to: string;
    subject: string;
    html: string;
    otp_code?: string; // 添加一个可选的 otp_code 字段
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

    let finalHtml = data.html; // 默认使用 Clerk 提供的原文 HTML

    // 1. 检查是否收到了 otp_code
    if (data.otp_code) {
        // 2. 如果有，就用我们自己的中文模板替换原文
        finalHtml = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <h1 style="color: #333; text-align: center;">张江多功能墙 - 您的验证码</h1>
          <p>您好！您的验证码是：</p>
          <p style="text-align: center; margin: 20px 0;">
            <span style="font-size: 28px; font-weight: bold; color: #007bff; letter-spacing: 4px; border: 1px solid #ddd; padding: 12px 20px; border-radius: 4px; background-color: #f4f4f4;">
              ${data.otp_code}
            </span>
          </p>
          <p>如果您没有请求此验证码，请忽略本邮件。</p>
          <p style="margin-top: 30px; font-size: 12px; color: #888; text-align: center;">
            张江多功能墙
          </p>
        </div>
      </div>
    `;
    }

    return await transporter.sendMail({
        from: `张江多功能墙 <${process.env.SMTP_USER}>`,
        to: data.to,
        subject: data.subject,
        html: finalHtml, // 使用最终处理过的 HTML
    });
};