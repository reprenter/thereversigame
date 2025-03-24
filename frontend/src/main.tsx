import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.module.scss'
import Game from './pages/Game/GamePage'

// import './index.module.scss'
// import { HelloPage } from './pages/Hello'
// import axios from 'axios';


// console.log(axios.defaults.baseURL)
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Game />
  </StrictMode>
)
