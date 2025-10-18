import React, { useState } from "react";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";

export default function MessageInput({ sendMessage }) {
    const [text, setText] = useState("");
    const [showEmoji, setShowEmoji] = useState(false);

    const handleSend = () => {
        if (!text.trim()) return;
        sendMessage(text);
        setText("");
    };

    const handleFile = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            sendMessage(`[FILE] ${file.name}::${reader.result}`);
        };
        reader.readAsDataURL(file);
        e.target.value = null; // reset input
    };

    return (
        <div className="flex flex-col">
            {showEmoji && (
                <div className="absolute bottom-16 left-4 z-50">
                    <Picker
                        data={data}
                        onEmojiSelect={(emoji) => setText((prev) => prev + emoji.native)}
                    />
                </div>
            )}
            <div className="flex p-4 bg-gray-800 dark:bg-gray-700 relative">
                <button
                    onClick={() => setShowEmoji(!showEmoji)}
                    className="p-2 bg-gray-600 dark:bg-gray-600 rounded-l hover:bg-gray-500"
                >
                    😊
                </button>
                <input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    placeholder="Digite uma mensagem..."
                    className="flex-1 p-2 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
                <label className="p-2 bg-green-600 dark:bg-green-500 text-white rounded-r cursor-pointer hover:bg-green-700 dark:hover:bg-green-600">
                    📎
                    <input type="file" className="hidden" onChange={handleFile} />
                </label>
                <button
                    onClick={handleSend}
                    className="p-2 bg-blue-600 dark:bg-blue-500 text-white rounded-r ml-2 hover:bg-blue-700 dark:hover:bg-blue-600"
                >
                    Enviar
                </button>
            </div>
        </div>
    );
}
