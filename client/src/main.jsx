import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { LazyMotion, domAnimation } from 'framer-motion';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LazyMotion features={domAnimation}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </LazyMotion>
  </React.StrictMode>,
);
