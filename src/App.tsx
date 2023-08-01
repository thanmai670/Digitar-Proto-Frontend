import React, { useEffect, useState, useRef } from 'react';
import WaveSurfer from 'wavesurfer.js';
import styles from './App.module.css';

interface ServerMessage {
  transcribed_text?: string;
  response_text?: string;
  response_audio?: string;
}

const App: React.FC = () => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [recorder, setRecorder] = useState<any | null>(null);
  const [serverMessage, setServerMessage] = useState<ServerMessage | null>(null);

  const serverWaveSurfer = useRef<WaveSurfer | null>(null);

  // Establish websocket connection
  useEffect(() => {
    const socket = new WebSocket('ws://localhost:8000/listen');

    socket.onopen = () => {
      console.log('WebSocket Client Connected');
      setSocket(socket);
    };

    socket.onmessage = (message) => {
      const data: ServerMessage = JSON.parse(message.data);
      console.log(data);
      setServerMessage(data);
      if (data.response_audio) {
        let audio = new Audio('data:audio/wav;base64,' + data.response_audio);

        fetch('data:audio/wav;base64,' + data.response_audio)
          .then(response => response.blob())
          .then(audioBlob => {
            serverWaveSurfer.current?.loadBlob(audioBlob);
          });

        audio.onerror = function() {
          console.log('Audio playback error');
        };

        audio.oncanplay = function() {
            console.log('Audio is able to start playing now');
            audio.play();
        };
      }
    };

    serverWaveSurfer.current = WaveSurfer.create({
      container: '#server-waveform',
      waveColor: 'violet',
      progressColor: 'purple'
    });

  }, []);

  const startRecording = () => {
    // Ask for audio permission and start recording
    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks : any = [];

      setRecorder(mediaRecorder);

      mediaRecorder.addEventListener("dataavailable", event => {
        audioChunks.push(event.data);

        // After pushing to audioChunks, create a Blob and send it to the server
        const audioBlob = new Blob(audioChunks,{type : 'audio/wav'});
        const reader = new FileReader();
        reader.readAsArrayBuffer(audioBlob);
        reader.onloadend = () => {
          if (reader.result) {
            let arrayBuffer = reader.result as ArrayBuffer;
            let array = new Uint8Array(arrayBuffer);
            if (socket && socket.readyState === WebSocket.OPEN) {
              socket.send(array.buffer); // Sending the audio data to the server via websocket
            }
          }
        }

        // Clear the audioChunks after sending the data
        audioChunks.length = 0;
      });

      mediaRecorder.start(1000); // Set timeslice so dataavailable event triggers every second
    });
  }

  const stopRecording = () => {
    // Stop the recording
    recorder?.stop();
  }

  return (
    <div className={styles.app}>
      <h2 className={styles.title}>Digitar.ai</h2>
      <div className={styles.section}>
        <h3>Your Query:</h3>
        <textarea className={styles.textBox} readOnly value={serverMessage?.transcribed_text || ''} />
      </div>
      <div className={styles.section}>
        <h3>Digitar Response:</h3>
        <div id="server-waveform"></div>
        <textarea className={styles.textBox} readOnly value={serverMessage?.response_text || ''} />
      </div>
      <button className={styles.button} onClick={startRecording}>Start Talking</button>
      <button className={styles.button} onClick={stopRecording}>Stop Talking</button>
    </div>
  );
}

export default App;
