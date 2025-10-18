import React from "react";

export default function MessageBubble({ message, own, avatar }) {
    return (
        <div
            className={`flex items-end gap-2 max-w-xs transition-transform duration-200 transform ${
                own ? "self-end flex-row-reverse" : "self-start"
            }`}
        >
            {avatar && (
                <img
                    src={avatar}
                    alt="avatar"
                    className="w-8 h-8 rounded-full object-cover"
                />
            )}
            <div
                className={`p-2 rounded-lg break-words shadow-md ${
                    own ? "bg-blue-500 text-white" : "bg-gray-700 dark:bg-gray-300 text-black"
                }`}
            >
                {message.content}
            </div>
        </div>
    );
}
