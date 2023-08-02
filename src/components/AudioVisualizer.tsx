import React, { useRef, useEffect } from 'react';
import styled from 'styled-components';
import * as d3 from 'd3';

// define props
interface AudioVisualizerProps {
  audioContext: AudioContext;
  analyser: AnalyserNode;
}

// define component
const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ audioContext, analyser }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const requestIdRef = useRef<number | null>(null);

  const draw = (context: CanvasRenderingContext2D, analyser: AnalyserNode) => {
    const canvas = context.canvas;
    const frequencyData = new Uint8Array(analyser.frequencyBinCount);
  
    // get the frequency data from the currently playing music
    analyser.getByteFrequencyData(frequencyData);
  
    // clear the canvas
    context.clearRect(0, 0, canvas.width, canvas.height);
  
    // always draw a horizontal line
    var height = 0;
    for (var i = 0; i < analyser.frequencyBinCount; i++) {
      var value = frequencyData[i];
      var percent = value / 255;
      height = canvas.height * percent;
    }
  
    var offset = canvas.height - height - 1;
    context.strokeStyle = '#008080'; // Teal color
    context.beginPath();
    context.moveTo(0, offset);
    context.lineTo(canvas.width, offset);
    context.stroke();
  
    // turn the byte array into something drawable
    const radiusScale = canvas.height / 400;
    const xOffset = 50; // Adjust this value to change the starting position of the waveform
    for (var i = 0; i < analyser.frequencyBinCount; i++) {
      var value = frequencyData[i];
      var percent = value / 255;
      var height = canvas.height * percent;
      var offset = canvas.height - height - 1;
      var barWidth = canvas.width / analyser.frequencyBinCount;
  
      context.fillStyle = '#008080'; // Teal color
      context.fillRect(i * barWidth + xOffset, offset, barWidth, height);
    }
  
    requestIdRef.current = requestAnimationFrame(() => draw(context, analyser));
  }
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    // Start the animation loop
    requestIdRef.current = requestAnimationFrame(() => draw(context, analyser));

    // Clean up function
    return () => {
      if (requestIdRef.current) {
        cancelAnimationFrame(requestIdRef.current);
      }
    }
  }, []);

  return <canvas ref={canvasRef} />;
}

export default AudioVisualizer;
