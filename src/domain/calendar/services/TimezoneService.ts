export class TimezoneService {
  static getDefault(): string {
    if (typeof window !== 'undefined') {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    }
    return process.env.TZ || 'UTC';
  }

  static getAvailableZones(): string[] {
    return [
      'UTC',
      'America/New_York',
      'America/Chicago',
      'America/Denver',
      'America/Los_Angeles',
      'America/Anchorage',
      'America/Phoenix',
      'America/Toronto',
      'America/Vancouver',
      'America/Mexico_City',
      'America/Sao_Paulo',
      'Europe/London',
      'Europe/Paris',
      'Europe/Berlin',
      'Europe/Madrid',
      'Europe/Rome',
      'Europe/Amsterdam',
      'Europe/Stockholm',
      'Europe/Moscow',
      'Asia/Dubai',
      'Asia/Kolkata',
      'Asia/Bangkok',
      'Asia/Singapore',
      'Asia/Hong_Kong',
      'Asia/Shanghai',
      'Asia/Tokyo',
      'Asia/Seoul',
      'Australia/Sydney',
      'Australia/Melbourne',
      'Australia/Perth',
      'Pacific/Auckland',
    ];
  }

  static toUTC(timestamp: number, fromZone: string): number {
    const date = new Date(timestamp);
    const fromOffset = this.getOffset(date, fromZone);
    return timestamp - fromOffset * 60 * 1000;
  }

  static fromUTC(timestamp: number, toZone: string): number {
    const date = new Date(timestamp);
    const toOffset = this.getOffset(date, toZone);
    return timestamp + toOffset * 60 * 1000;
  }

  static getOffset(date: Date, timezone: string): number {
    const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
    const tzDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
    return (tzDate.getTime() - utcDate.getTime()) / 60000 / 60;
  }

  static formatInZone(timestamp: number, timezone: string, format: string): string {
    return new Date(timestamp).toLocaleString('en-US', {
      timeZone: timezone,
      ...this.parseFormat(format),
    });
  }

  private static parseFormat(format: string): Intl.DateTimeFormatOptions {
    const options: Intl.DateTimeFormatOptions = {};
    
    if (format.includes('YYYY')) options.year = 'numeric';
    if (format.includes('MM')) options.month = '2-digit';
    if (format.includes('DD')) options.day = '2-digit';
    if (format.includes('HH')) options.hour = '2-digit';
    if (format.includes('mm')) options.minute = '2-digit';
    
    return options;
  }

  static convert(timestamp: number, fromZone: string, toZone: string): number {
    const utc = this.toUTC(timestamp, fromZone);
    return this.fromUTC(utc, toZone);
  }
}

export default TimezoneService;