//message_input.js
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";

const MessageInput = ({ onSubmit, onTypingStart, onTypingStop }) => {
  const [input, setInput] = useState('');

  const handleChange = async (e) => {
    setInput(e.target.value);
    if (e.target.value) {
      try {
        await onTypingStart();  // Handle promise and catch errors
      } catch (error) {
        console.error('Failed to start typing indicator:', error);
      }
    } else {
      try {
        await onTypingStop();   // Handle promise and catch errors
      } catch (error) {
        console.error('Failed to stop typing indicator:', error);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    onSubmit(input);
    setInput('');
    try {
      await onTypingStop();  // Stop typing after message is sent
    } catch (error) {
      console.error('Failed to stop typing indicator:', error);
    }
  };

  useEffect(() => {
    const handleStopTyping = async () => {
      try {
        await onTypingStop();  // Handle promise and stop typing on unmount
      } catch (error) {
        console.error('Failed to stop typing indicator on unmount:', error);
      }
    };
    return handleStopTyping;
  }, [onTypingStop]);

  return (
    <form onSubmit={handleSubmit}>
      <Input
        type="text"
        value={input}
        onChange={handleChange}
        placeholder={"Your message here"}
        onBlur={async () => {
          try {
            await onTypingStop();  // Stop typing when input loses focus
          } catch (error) {
            console.error('Failed to stop typing indicator on blur:', error);
          }
        }}
      />
    </form>
  );
};

export default MessageInput;
