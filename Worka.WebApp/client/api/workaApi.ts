import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Platform } from 'react-native';

export const TOKEN_KEY = 'token';

export type WorkaResponse<T> = {
  success?: boolean;
  message?: string | null;
  data?: T;
  errors?: string[];
  token?: string | null;
};

export type AccountType = 0 | 1 | 'Customer' | 'Professional' | 'customer' | 'professional';

export type UserResponse = {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  accountType: AccountType;
  createdDate: string;
};

export type CustomerAccount = {
  customerId: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
};

export type ProfessionalAccount = {
  professionalId: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  specialty: string;
  bio: string;
  serviceArea: string;
};

export type Job = {
  jobId: string;
  jobName: string;
  jobDescription: string;
  category: string;
  address: string;
  customerId: string;
  acceptedQuoteId?: string | null;
  jobStatus: number | string;
  createdAt: string;
};

export type Quote = {
  quoteId: string;
  professionalId: string;
  jobId: string;
  price: number;
  description: string;
  createdAt: string;
};

const configuredApiUrl = process.env.EXPO_PUBLIC_API_URL;

const apiBaseUrl =
  configuredApiUrl ||
  (Platform.OS === 'web'
    ? '/api'
    : 'https://api.worka-uk.online');

export const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 15000,
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function unwrap<T>(payload: WorkaResponse<T> | T): T {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as WorkaResponse<T>).data as T;
  }

  return payload as T;
}

export function getErrorMessage(error: unknown, fallback = 'Something went wrong.') {
  if (axios.isAxiosError(error)) {
    const responseMessage = error.response?.data?.message;
    if (responseMessage) {
      return String(responseMessage);
    }

    const errors = error.response?.data?.errors;
    if (Array.isArray(errors) && errors.length > 0) {
      return String(errors[0]);
    }

    return error.message || fallback;
  }

  return error instanceof Error ? error.message : fallback;
}

export function formatMoney(value: number | string | null | undefined) {
  const amount = Number(value ?? 0);
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);
}

export function formatDate(value: string | null | undefined) {
  if (!value) {
    return 'New';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'New';
  }

  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
  }).format(date);
}
