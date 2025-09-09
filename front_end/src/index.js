import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import './i18n'; //언어 모드 변경
import { ThemeProvider } from './contexts/ThemeContexts';
import { LanguageProvider } from './contexts/LanguageContext';
const Loading = () => <div>Loading translations...</div>;

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <LanguageProvider>
    <ThemeProvider>
      <Suspense fallback={<Loading />}>
        <App />
      </Suspense>
    </ThemeProvider>
  </LanguageProvider>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
