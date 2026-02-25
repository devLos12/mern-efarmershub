import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from "./pages/App.jsx";
import { BrowserRouter as Router } from 'react-router-dom';
import { MyAppContext } from './context/appContext.jsx';
import "./styles/index.css";
import 'bootstrap/dist/css/bootstrap.min.css'; 
import ScrollToTop from './components/scrollTop.jsx';




createRoot(document.getElementById('root')).render(
  <StrictMode>
      <Router>

        <MyAppContext>
          <ScrollToTop/>
          <App />
        </MyAppContext>
      </Router>
  </StrictMode>
)
