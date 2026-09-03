import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.tsx'
import LoginPage from "./Layout/LoginPage.tsx";
import SignupPage from "./Layout/SignupPage.tsx";
import Dashboard from "./Layout/DashBoard.tsx";
import AnalyzePage from "./Layout/AnalyzePage.tsx";
import WelcomePage from "./Layout/WelcomePage.tsx";
import Chatbot from "./Layout/Chatbot.tsx";

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<App />} />
                <Route path="/analyze" element={<AnalyzePage />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path= "/Signup" element={<SignupPage />} />
                <Route path= "/Welcome" element={<WelcomePage />} />
                <Route path= "/Chatbot" element={<Chatbot />} />
            </Routes>
        </BrowserRouter>
    </React.StrictMode>,
)
