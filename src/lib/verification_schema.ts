// lib/schemas.ts
import { z } from 'zod';

export const verificationRequestSchema = z.object({
    realName: z.string().min(1, { message: '真实姓名不能为空' }),
    classNumber: z.string().regex(/^\d{4}$/, { message: '班级必须是4位数字' }),
    email: z.string().email({ message: '邮箱格式不正确' }).endsWith('@hsefz.cn', { message: '必须是 hsefz.cn 邮箱' }),
});