/**
 * Demo Entry Point for Screens Machine UI
 * Session 45 Part 9 - Live UI Evidence
 */

import '../styles/main.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { DemoApp } from './DemoApp';
import { LangProvider } from '@context/LangContext';
import { ThemeProvider } from '@context/ThemeContext';
import { ViewSettingsProvider } from '@context/ViewSettingsContext';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <ViewSettingsProvider>
          <LangProvider>
            <DemoApp />
          </LangProvider>
        </ViewSettingsProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
