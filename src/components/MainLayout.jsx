import React, { useState, useEffect, useRef } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import { useAuth } from "../auth/AuthProvider.jsx";

export default function MainLayout() {
	const navigate = useNavigate();
	const auth = useAuth();

	const [displayName, setDisplayName] = useState(() => {
		try {
			if (auth?.user) {
				return auth.user.UserName || auth.user.userName || auth.user.username || auth.user.preferred_username || auth.user.given_name || auth.user.name || auth.user.unique_name || auth.user.email || 'Usuário';
			}
			const raw = typeof window !== 'undefined' ? localStorage.getItem('auth_user') : null;
			if (raw) {
				const parsed = JSON.parse(raw);
				return parsed?.UserName || parsed?.userName || parsed?.username || parsed?.name || parsed?.email || 'Usuário';
			}
		} catch (e) {
			// ignore
		}
		return 'Usuário';
	});

	const [theme, setTheme] = useState(() => {
		try { return typeof window !== 'undefined' ? localStorage.getItem('theme') || 'pink' : 'pink'; } catch (e) { return 'pink'; }
	});
	const [themeOpen, setThemeOpen] = useState(false);
	const themeRef = useRef(null);

	useEffect(() => {
		try {
			localStorage.setItem('theme', theme);
			document.documentElement.setAttribute('data-theme', theme);
		} catch (e) {}
	}, [theme]);

	useEffect(() => {
		const onDocClick = (ev) => {
			if (themeRef.current && !themeRef.current.contains(ev.target)) setThemeOpen(false);
		};
		document.addEventListener('click', onDocClick);
		return () => document.removeEventListener('click', onDocClick);
	}, []);

	useEffect(() => {
		// update when auth.user changes (e.g., after login)
		if (auth?.user) {
			setDisplayName(auth.user.UserName || auth.user.userName || auth.user.username || auth.user.preferred_username || auth.user.given_name || auth.user.name || auth.user.unique_name || auth.user.email || 'Usuário');
			return;
		}

		// otherwise read from localStorage in case login wrote user info there
		try {
			const raw = localStorage.getItem('auth_user');
			if (raw) {
				const parsed = JSON.parse(raw);
				setDisplayName(parsed?.UserName || parsed?.userName || parsed?.username || parsed?.name || parsed?.email || 'Usuário');
			}
		} catch (e) {}

		// listen for storage events from other tabs
		const onStorage = (ev) => {
			if (ev.key === 'auth_user') {
				try {
					const parsed = ev.newValue ? JSON.parse(ev.newValue) : null;
					setDisplayName(parsed?.UserName || parsed?.userName || parsed?.username || parsed?.name || parsed?.email || 'Usuário');
				} catch (e) {}
			}
		};
		window.addEventListener('storage', onStorage);
		return () => window.removeEventListener('storage', onStorage);
	}, [auth?.user]);

	const wrapperClass = theme === 'dark' ? 'min-h-screen bg-slate-900 flex' : 'min-h-screen bg-pink-50 flex';

	return (
		<div className={wrapperClass}>
			<Sidebar />

			<div className="flex-1 p-6">
				<main className="w-full">
					<header className="sticky top-0 z-20">
						<div className="flex justify-end items-center gap-4">
							<div className={theme === 'dark' ? 'flex items-center gap-3 bg-slate-800/60 px-3 py-2 rounded-full' : 'flex items-center gap-3 bg-pink-100 px-3 py-2 rounded-full'}>
								<div className="w-8 h-8 rounded-full bg-white overflow-hidden">
									<img src="/avatar.png" alt="avatar" className="w-full h-full object-cover" onError={(e)=>{e.target.onerror=null;e.target.src='data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22><rect width=%22100%22 height=%22100%22 fill=%22%23fff%22/></svg>'}} />
								</div>
								<div className={theme === 'dark' ? 'text-sm font-semibold text-white' : 'text-sm font-semibold text-pink-700'}>Olá, {displayName}</div>
								<button
									type="button"
									onClick={() => {
										try { localStorage.removeItem("token"); } catch (e) {}
										try { document.cookie = 'token=; Max-Age=0; path=/'; } catch (e) {}
										navigate('/login');
									}}
									className="text-sm text-pink-600 hover:underline"
								>
									Sair
								</button>

								{/* Theme chooser */}
								<div className="relative" ref={themeRef}>
									<button type="button" onClick={() => setThemeOpen(v => !v)} className="ml-2 text-sm text-pink-600 hover:underline">Tema</button>
									{themeOpen && (
										<div className="absolute right-0 mt-2 w-48 bg-white rounded shadow p-3 text-sm z-30">
											<div className="mb-2 font-semibold">Escolher Tema</div>
											<label className="flex items-center space-x-2 mb-2">
												<input type="radio" name="theme" value="pink" checked={theme === 'pink'} onChange={() => setTheme('pink')} />
												<span>Rosa</span>
											</label>
											<label className="flex items-center space-x-2">
												<input type="radio" name="theme" value="dark" checked={theme === 'dark'} onChange={() => setTheme('dark')} />
												<span>Azul Escuro</span>
											</label>
										</div>
									)}
								</div>
							</div>
						</div>
					</header>

					<Outlet />
				</main>
			</div>
		</div>
	);
}

