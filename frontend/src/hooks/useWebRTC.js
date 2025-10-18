import { useRef } from "react";

export default function useWebRTC(ws, localVideoRef, remoteVideoRef) {
    const pcRef = useRef(new RTCPeerConnection());

    const startCall = async (user) => {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localVideoRef.current.srcObject = stream;
        stream.getTracks().forEach(track => pcRef.current.addTrack(track, stream));

        pcRef.current.ontrack = (event) => {
            remoteVideoRef.current.srcObject = event.streams[0];
        };

        const offer = await pcRef.current.createOffer();
        await pcRef.current.setLocalDescription(offer);
        ws.send(JSON.stringify({ type: "call", offer, to: user }));
    };

    const endCall = () => {
        pcRef.current.getSenders().forEach(sender => sender.track.stop());
        pcRef.current.close();
    };

    return { startCall, endCall };
}
