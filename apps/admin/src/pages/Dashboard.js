import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import axios from 'axios';
const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';
export function Dashboard() {
    const [me, setMe] = useState(null);
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/';
            return;
        }
        axios.get(`${API}/me`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => setMe(r.data.user))
            .catch(() => window.location.href = '/');
    }, []);
    return (_jsxs("div", { style: { maxWidth: 900, margin: '2rem auto', fontFamily: 'Inter, system-ui' }, children: [_jsx("h2", { children: "Admin Dashboard (MVP)" }), _jsx("pre", { children: JSON.stringify(me, null, 2) })] }));
}
