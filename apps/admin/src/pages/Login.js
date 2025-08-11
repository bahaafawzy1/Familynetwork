import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import axios from 'axios';
const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';
export function Login() {
    const [email, setEmail] = useState('');
    const [step, setStep] = useState('enter');
    const [code, setCode] = useState('');
    const [message, setMessage] = useState('');
    const requestOtp = async () => {
        setMessage('');
        try {
            await axios.post(`${API}/auth/request-otp`, { email, purpose: 'login' });
            setStep('code');
        }
        catch (e) {
            setMessage('Failed to send code');
        }
    };
    const verifyOtp = async () => {
        setMessage('');
        try {
            const res = await axios.post(`${API}/auth/verify-otp`, { email, code, role: 'ADMIN' });
            localStorage.setItem('token', res.data.token);
            window.location.href = '/dashboard';
        }
        catch (e) {
            setMessage('Invalid code');
        }
    };
    return (_jsxs("div", { style: { maxWidth: 400, margin: '4rem auto', fontFamily: 'Inter, system-ui' }, children: [_jsx("h1", { children: "Admin Login" }), step === 'enter' && (_jsxs("div", { children: [_jsx("label", { children: "Email" }), _jsx("input", { value: email, onChange: (e) => setEmail(e.target.value), style: { width: '100%', padding: 8 } }), _jsx("button", { onClick: requestOtp, style: { marginTop: 12 }, children: "Send Code" })] })), step === 'code' && (_jsxs("div", { children: [_jsx("label", { children: "Enter Code" }), _jsx("input", { value: code, onChange: (e) => setCode(e.target.value), style: { width: '100%', padding: 8 } }), _jsx("button", { onClick: verifyOtp, style: { marginTop: 12 }, children: "Verify" })] })), message && _jsx("p", { children: message })] }));
}
