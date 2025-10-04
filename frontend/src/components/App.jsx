import React, {useState, useEffect, useRef} from 'react';
import axios from 'axios';

export default function App(){
  const [msg, setMsg] = useState('');
  const wsRef = useRef(null);
  useEffect(()=> {
    wsRef.current = new WebSocket('ws://localhost:8080/ws');
    wsRef.current.onmessage = (ev)=> {
      console.log('msg', ev.data);
    };
    return ()=> wsRef.current.close();
  },[]);
  const send = ()=> {
    if(wsRef.current && wsRef.current.readyState === WebSocket.OPEN){
      wsRef.current.send(msg);
      setMsg('');
    }
  }
  return (
    <div style={{padding:20}}>
      <h1>Messenger - Frontend (basic)</h1>
      <div>
        <input value={msg} onChange={e=>setMsg(e.target.value)} placeholder='mensagem' />
        <button onClick={send}>Enviar</button>
      </div>
    </div>
  );
}
