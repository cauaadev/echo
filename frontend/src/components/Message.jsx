export default function Message({ message }) {
    return (
        <div className={`message ${message.fromMe ? "me" : "other"}`}>
            <div className="text">{message.text}</div>
            <small>{new Date(message.timestamp).toLocaleTimeString()}</small>
        </div>
    );
}
