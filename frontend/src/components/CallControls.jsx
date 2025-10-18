import { useRef, useState, useEffect } from "react";
import useWebRTC from "../hooks/useWebRTC";

export default function CallControls({ ws, callUser }) {
    const localVideoRef = useRef();
    const remoteVideoRef = useRef();
    const [mic, setMic] = useState(true);
    const [cam, setCam] = useState(true);
    const { startCall, endCall } = useWebRTC(ws, localVideoRef, remoteVideoRef);

    useEffect(() => {
        if (callUser) startCall(callUser);
    }, [callUser]);

    return (
        <div className="call-controls">
            <video ref={localVideoRef} autoPlay muted className="local-video" />
            <video ref={remoteVideoRef} autoPlay className="remote-video" />
            <div className="buttons">
                <button onClick={() => setMic(!mic)}>{mic ? "🎤" : "🔇"}</button>
                <button onClick={() => setCam(!cam)}>{cam ? "📹" : "❌"}</button>
                <button onClick={endCall}>Encerrar</button>
            </div>
        </div>
    );
}
