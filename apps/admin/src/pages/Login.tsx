import React, { useState } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export function Login() {
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<'enter' | 'code'>('enter');
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');

  const requestOtp = async () => {
    setMessage('');
    try {
      await axios.post(`${API}/auth/request-otp`, { email, purpose: 'login' });
      setStep('code');
    } catch (e: any) {
      setMessage('Failed to send code');
    }
  };

  const verifyOtp = async () => {
    setMessage('');
    try {
      const res = await axios.post(`${API}/auth/verify-otp`, { email, code, role: 'ADMIN' });
      localStorage.setItem('token', res.data.token);
      window.location.href = '/dashboard';
    } catch (e: any) {
      setMessage('Invalid code');
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '4rem auto', fontFamily: 'Inter, system-ui' }}>
      <h1>Admin Login</h1>
      {step === 'enter' && (
        <div>
          <label>Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: '100%', padding: 8 }} />
          <button onClick={requestOtp} style={{ marginTop: 12 }}>Send Code</button>
        </div>
      )}
      {step === 'code' && (
        <div>
          <label>Enter Code</label>
          <input value={code} onChange={(e) => setCode(e.target.value)} style={{ width: '100%', padding: 8 }} />
          <button onClick={verifyOtp} style={{ marginTop: 12 }}>Verify</button>
        </div>
      )}
      {message && <p>{message}</p>}
    </div>
  );
}