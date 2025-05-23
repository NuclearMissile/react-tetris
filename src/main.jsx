import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import './index.css'
import TetrisGame from "./TetrisGame.jsx";

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <TetrisGame/>
    </StrictMode>,
)
