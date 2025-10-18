import React, { useState } from "react";
import "./support.css";

export default function Support() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");

    const sendMessage = () => {
        if (!input.trim()) return;
        const newMessage = { id: Date.now(), text: input, sender: "user" };
        setMessages(prev => [...prev, newMessage]);
        setInput("");
    };

    return (
        <div className="support-container">
            <h1>Suporte ao Vivo</h1>

            <div className="support-topics">
                <h2>Como usar a plataforma</h2>
                <p>Confira nossos tutoriais e guias passo a passo para usar todos os recursos.</p>

                <h2>Problemas comuns</h2>
                <p>Se você encontrou algum erro ou bug, descreva aqui ou veja nossas FAQs.</p>

                <h2>Chat com funcionário</h2>
                <p>Fale diretamente com um atendente da nossa equipe de suporte.</p>
            </div>

            <div className="support-chat">
                <div className="chat-messages">
                    {messages.map(msg => (
                        <div key={msg.id} className={`chat-message ${msg.sender}`}>
                            {msg.text}
                        </div>
                    ))}
                </div>

                <div className="chat-input">
                    <input
                        type="text"
                        placeholder="Digite sua mensagem..."
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && sendMessage()}
                    />
                    <button onClick={sendMessage}>Enviar</button>
                </div>
            </div>
        </div>
    );
}
