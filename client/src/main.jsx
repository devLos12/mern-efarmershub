import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from "./pages/App.jsx";
import { BrowserRouter as Router } from 'react-router-dom';
import { MyAppContext } from './context/appContext.jsx';
import "./styles/index.css";
import 'bootstrap/dist/css/bootstrap.min.css'; 



createRoot(document.getElementById('root')).render(
  <StrictMode>
      <Router>
        <MyAppContext>
          <App />
        </MyAppContext>
      </Router>
  </StrictMode>
)
