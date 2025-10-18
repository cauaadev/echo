import { useState } from "react";

export default function UserList({ users, ws }) {
    const [addName, setAddName] = useState("");

    const addUser = () => {
        if (!addName) return;
        ws.send(JSON.stringify({ type: "addUser", usernameOrId: addName }));
        setAddName("");
    };

    return (
        <div className="user-list">
            <h3>Online</h3>
            {users.map(u => (
                <div key={u.id} className={u.online ? "online" : "offline"}>
                    {u.username}{u.blocked ? " 🚫" : ""}{u.muted ? " 🔇" : ""}
                </div>
            ))}
            <div className="add-user">
                <input
                    placeholder="Nome ou #id"
                    value={addName}
                    onChange={e => setAddName(e.target.value)}
                />
                <button onClick={addUser}>Adicionar</button>
            </div>
        </div>
    );
}
