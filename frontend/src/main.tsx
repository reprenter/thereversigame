import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// import './index.module.scss'
// import { HelloPage } from './pages/Hello'
import App from './pages/Game/GamePage.tsx';
// import axios from 'axios';


// console.log(axios.defaults.baseURL)
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
