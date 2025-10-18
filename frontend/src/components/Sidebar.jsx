import React from "react";

export default function Sidebar({ users, selectUser, selectedId }) {
    return (
        <div className="w-60 bg-gray-200 dark:bg-gray-800 p-4 flex flex-col gap-2 overflow-y-auto rounded-l-xl">
            <h4 className="font-bold mb-2">Usuários Online</h4>
            {users.map((u) => (
                <div
                    key={u.id}
                    className={`p-2 rounded cursor-pointer flex items-center gap-2 ${
                        selectedId === u.id ? "bg-blue-500 text-white" : "hover:bg-gray-300 dark:hover:bg-gray-700"
                    }`}
                    onClick={() => selectUser(u.id)}
                >
                    {u.avatar && <img src={u.avatar} alt="avatar" className="w-8 h-8 rounded-full" />}
                    <span>{u.username}</span>
                </div>
            ))}
        </div>
    );
}
