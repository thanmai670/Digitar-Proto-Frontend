import React, { useEffect, useRef, useState } from 'react';
import styles from './App.module.css';
import AudioVisualizer from './components/AudioVisualizer';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMicrophone, faStop } from '@fortawesome/free-solid-svg-icons';
const StyledVisualizer = styled(AudioVisualizer)`
  margin-top: 50px; // Increase this value as per your needs
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
  const source = useRef(audioContext.current.createBufferSource());

  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [recorder, setRecorder] = useState<any | null>(null);
  const [serverMessage, setServerMessage] = useState<ServerMessage | null>(null);
  const textAreaRef = useRef<HTMLDivElement | null>(null);

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

      if (data.response_audio) {
        // Convert base64 audio to Uint8Array for visualizer
        let raw = window.atob(data.response_audio);
        let rawLength = raw.length;
        let array = new Uint8Array(new ArrayBuffer(rawLength));

        for (let i = 0; i < rawLength; i++) {
          array[i] = raw.charCodeAt(i);
        }

        data.audioData = array;

        audioContext.current.decodeAudioData(array.buffer).then((buffer) => {
          source.current.buffer = buffer;

          // Connect the source to the analyser and the context's destination
          source.current.connect(analyser.current);
          analyser.current.connect(audioContext.current.destination);

          // Start the source
          source.current.start();
        });

        // let audio = new Audio('data:audio/wav;base64,' + data.response_audio);
        // audio.oncanplay = function() {
        //   console.log('Audio is able to start playing now');
        //   audio.play();
        // };
      }

      setServerMessage(data);
    };
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
      </div>
      
    </div>
  );
}

export default App;
