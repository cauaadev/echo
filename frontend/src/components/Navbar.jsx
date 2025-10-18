import React from "react";

export default function Navbar({ authed, onLogout, toggleDark, darkMode, toggleRegister }) {
    return (
        <header className="flex justify-between items-center p-4 bg-gray-200 dark:bg-gray-800 rounded-b-lg shadow-md">
            <h1 className="text-xl font-bold">Messenger Pro</h1>
            <div className="flex items-center gap-3">
                <button onClick={toggleDark} className="btn px-2 py-1 rounded">
                    {darkMode ? "☀️ Light" : "🌙 Dark"}
                </button>
                {!authed && (
                    <button onClick={toggleRegister} className="btn px-2 py-1 rounded">
                        Criar Conta / Login
                    </button>
                )}
                {authed && (
                    <button onClick={onLogout} className="btn px-2 py-1 rounded bg-red-500 text-white">
                        Sair
                    </button>
                )}
            </div>
        </header>
    );
}
