// src/components/TextInput.tsx

import React, { useState } from 'react';
import styled from 'styled-components';

type TextInputProps = {
  onInput: (input: string) => void;
};

const StyledForm = styled.form`
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  gap: 1em;
  margin-top: 2em;
  width: 100%;
`;


const StyledInput = styled.input`
  padding: 0.5em;
  font-size: 1.5em;
  border-radius: 5px;
  border: none;
  width: 60%;
  box-shadow: 0 2px 5px 0 rgba(0,0,0,0.16), 0 2px 10px 0 rgba(0,0,0,0.12); // Added shadow
  transition: box-shadow .3s; // Added transition for shadow
  &:focus {
    outline: none;
    box-shadow: 0 3px 15px rgba(0,0,0,0.2); // Increase shadow on focus
  }
`;

const StyledButton = styled.button`
  padding: 0.5em 1em;
  font-size: 1.5em;
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: rgba(0, 0, 0, 0.8);
  }
`;

const TextInput: React.FC<TextInputProps> = ({ onInput }) => {
  const [input, setInput] = useState<string>('');

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInput(event.target.value);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onInput(input);
  };

  return (
    <StyledForm onSubmit={handleSubmit}>
      <StyledInput
        type="text"
        value={input}
        onChange={handleInputChange}
        placeholder="Type something..."
      />
      <StyledButton type="submit">Speak!</StyledButton>
    </StyledForm>
  );
};

export default TextInput;