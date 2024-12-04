import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';

export function generateRandomPassword(length: number = 12): string {
    return crypto.randomBytes(length).toString('base64').slice(0, length);
}