// import necessary dependencies
import React, { useRef, useEffect } from 'react';
import styled from 'styled-components';
import * as d3 from 'd3';

// define props
type AudioVisualizerProps = {
  data: Uint8Array;
};

// define component
const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ data }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // canvas drawing function
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = d3.select(canvasRef.current);
    const context = canvas.node()!.getContext('2d')!;
    const height = +canvas.attr('height');
    const width = +canvas.attr('width');
    context.fillStyle = 'white';
    context.lineWidth = 2;
    context.clearRect(0, 0, width, height);

    // Start from the middle of the canvas
    const yScale = d3.scaleLinear().domain([0, 255]).range([height, 0]);
    context.beginPath();
    context.strokeStyle = 'white'; // set line color to white

    const xPadding = width * 0.2;  // controls where the wave line starts, 20% of canvas width in this case
    const lineLength = width * 0.6;  // controls length of the line, 60% of canvas width in this case

    // If data is all zero, draw a line in the middle
    if (data.every((value) => value === 128)) {
      context.moveTo(xPadding, yScale(128));
      context.lineTo(xPadding + lineLength, yScale(128));
    } else {
      data.forEach((value, i) => {
        if (i > data.length / 4 && i < (3 * data.length / 4)) {
          context.lineTo(xPadding + ((i / data.length) * lineLength), yScale(value));
        }
      });
    }
    context.stroke();
  }, [data]);

  return <canvas ref={canvasRef} width={window.innerWidth} height={150} />;
};

export default AudioVisualizer;