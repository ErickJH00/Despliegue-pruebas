import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import 'react-big-calendar/lib/css/react-big-calendar.css';

// CORRECCIÓN CLAVE:
// Importamos 'App.tsx' (con .tsx)
import App from './App.tsx';

// Importamos el CSS (que sí se llama index.css)
import './index.css';

// El '!' es para decirle a TypeScript que 'root' no es nulo
const root = ReactDOM.createRoot(document.getElementById('root')!); 

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);