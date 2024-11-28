import { NextRequest } from 'next/server';

import config from '@/server/config'

export const isValidApiToken = (token: string) => config.PUBLIC_API_KEYS.includes(token);