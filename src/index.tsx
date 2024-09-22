import React from 'react';
import ReactDOM from 'react-dom/client';
import reportWebVitals from './reportWebVitals';
import ITM from './ITM/Itm';
import TellerScreen from './Teller/TellerScreen';
import Teams from './Teams/Teams';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';


const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  //<Teams />
  //<TellerScreen />
  //<ITM />

  <Router>
    <Routes>
      <Route path="/" element={<ITM />} />
      <Route path="/teller" element={<TellerScreen />} />
      <Route path="/teams" element={<Teams />} />
    </Routes>
  </Router>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
