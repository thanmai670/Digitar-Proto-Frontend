import React, { useEffect, useRef, useState } from 'react';
import styles from './App.module.css';
import AudioVisualizer from './components/AudioVisualizer';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMicrophone, faStop, faSync } from '@fortawesome/free-solid-svg-icons';

const StyledVisualizer = styled(AudioVisualizer)`
  margin-top: 50px;
`;

const VisualizerContainer = styled.div`
  display: flex;
  justify-content: center;
`;

interface ServerMessage {
  transcribed_text?: string;
  response_text?: string;
  response_audio?: string;
  audioData?: Uint8Array;
}

const App: React.FC = () => {
  const audioContext = useRef(new AudioContext());
  const analyser = useRef(audioContext.current.createAnalyser());
  const source = useRef<AudioBufferSourceNode | null>(null);
  
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<string>("Connecting...");
  const [recorder, setRecorder] = useState<any | null>(null);
  const [serverMessage, setServerMessage] = useState<ServerMessage | null>(null);
  const [isResponsePlaying, setIsResponsePlaying] = useState<boolean>(false);
  const textAreaRef = useRef<HTMLDivElement | null>(null);

  let keepAliveInterval: NodeJS.Timeout | null = null;

  useEffect(() => {
    connectSocket();
  }, []);

  const startKeepAlivePackets = () => {
    if (keepAliveInterval) {
      clearInterval(keepAliveInterval);
    }
    
    keepAliveInterval = setInterval(() => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(new Uint8Array(1).buffer);
      }
    }, 30000);
  }

  const stopKeepAlivePackets = () => {
    if (keepAliveInterval) {
      clearInterval(keepAliveInterval);
      keepAliveInterval = null;
    }
  }

  const stopResponseAudio = () => {
    source.current?.stop();
    setIsResponsePlaying(false);
  }

  const connectSocket = () => {
    const socket = new WebSocket(process.env.REACT_APP_WEBSOCKET_URL || 'ws://localhost:8000/listen');

    socket.onopen = () => {
      console.log('WebSocket Client Connected');
      setSocket(socket);
      setConnectionStatus("Connected");
      startKeepAlivePackets();
    };

    socket.onclose = (event) => {
      console.log('WebSocket Connection Closed', event);
      setSocket(null);
      setConnectionStatus("Disconnected");
      stopKeepAlivePackets();
    };

    socket.onerror = (error) => {
      console.log('WebSocket Error: ', error);
      setConnectionStatus("Error in connection");
    };

    socket.onmessage = (message) => {
      const data: ServerMessage = JSON.parse(message.data);
      console.log(data);
      if (data.response_audio) {
        // Stop the audio if it's currently being played
        if (isResponsePlaying) {
          stopResponseAudio();
        }
      
        let raw = window.atob(data.response_audio);
        let rawLength = raw.length;
        let array = new Uint8Array(new ArrayBuffer(rawLength));
        
        for (let i = 0; i < rawLength; i++) {
          array[i] = raw.charCodeAt(i);
        }
        
        data.audioData = array;
        
        audioContext.current.decodeAudioData(array.buffer).then((buffer) => {
          source.current = audioContext.current.createBufferSource();
          source.current.buffer = buffer;
          source.current.connect(analyser.current);
          analyser.current.connect(audioContext.current.destination);
          source.current.start();
          setIsResponsePlaying(true);
          source.current.onended = () => setIsResponsePlaying(false);
        });
      }
      
    
      setServerMessage(data);
    };
  };

  const startRecording = () => {
    if (socket && socket.readyState !== WebSocket.OPEN) {
      connectSocket();
    }

    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks : any = [];

      setRecorder(mediaRecorder);

      mediaRecorder.addEventListener("dataavailable", event => {
        audioChunks.push(event.data);

        const audioBlob = new Blob(audioChunks,{type : 'audio/wav'});
        const reader = new FileReader();
        reader.readAsArrayBuffer(audioBlob);
        reader.onloadend = () => {
          if (reader.result) {
            let arrayBuffer = reader.result as ArrayBuffer;
            let array = new Uint8Array(arrayBuffer);
            if (socket && socket.readyState === WebSocket.OPEN) {
              socket.send(array.buffer);
            }
          }
        }

        audioChunks.length = 0;
      });

      mediaRecorder.start(1000);
    });
  }

  const stopRecording = () => {
    recorder?.stop();
  }

  return (
    <div className={styles.app}>
      <h2 className={styles.title}>Digitar.ai</h2>
      <p className={styles.status}>{connectionStatus}</p>
      <div className={styles.section}>
        <h3>Digitar Response:</h3>
        <div className={styles.textBox} ref={textAreaRef}>
          {serverMessage?.response_text || ''}
        </div>
      </div>

      <VisualizerContainer>
        <StyledVisualizer audioContext={audioContext.current} analyser={analyser.current} />
      </VisualizerContainer>
     
      <div className={styles.buttonContainer}>
        <button className={styles.button} onClick={startRecording}>
          <FontAwesomeIcon icon={faMicrophone} />
          Start Talking
        </button>
        <button className={styles.button} onClick={stopRecording}>
          <FontAwesomeIcon icon={faStop} />
          Stop Talking
        </button>
        <button className={styles.button} onClick={connectSocket}>
          <FontAwesomeIcon icon={faSync} />
          Reconnect
        </button>
        {isResponsePlaying && (
          <button className={styles.button} onClick={stopResponseAudio}>
            <FontAwesomeIcon icon={faStop} />
            Stop Response Audio
          </button>
        )}
      </div>
    </div>
  );
}

export default App;
