import React from 'react';
import {createRoot} from 'react-dom/client';
import {Analytics} from '@vercel/analytics/react';
import {locale} from '@/lib/i18n/locale';
import Home from './page';
import './globals.css';
document.documentElement.lang = locale;
createRoot(document.getElementById('root')!).render(<React.StrictMode><Home/><Analytics/></React.StrictMode>);
