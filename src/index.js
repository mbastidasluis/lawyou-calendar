import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
// import { Providers } from '@microsoft/mgt-element';
// import { MsalProvider } from '@microsoft/mgt-msal-provider';


// Providers.globalProvider = new MsalProvider({
//   clientId: '0c0f09d7-0679-4fbd-8b92-53fb15f969a7',
//   scopes: ['calendars.readwrite', 'user.read', 'openid', 'user.readbasic.all']
// });


ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
