// lib/formatDate.ts
import { formatInTimeZone } from 'date-fns-tz';

// 这个函数接收一个日期和一个格式字符串，返回格式化后的北京时间字符串
export function formatInBeijingTime(
    date: Date | string,
    formatString: string
): string {
    return formatInTimeZone(date, 'Asia/Shanghai', formatString);
}