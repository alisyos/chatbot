import React, { useState } from 'react';
import styled from 'styled-components';
import { generateResponse, resetConversation } from '../services/openai';

const Container = styled.div`
  width: 400px;
  height: 600px;
  border-radius: 10px;
  background: white;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
  margin: 20px auto;
`;

const Header = styled.div`
  padding: 15px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #eee;
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
`;

const Avatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #7000FF;
  margin-right: 10px;
`;

const HeaderText = styled.div``;

const Title = styled.h2`
  margin: 0;
  font-size: 16px;
`;

const Timestamp = styled.p`
  margin: 0;
  font-size: 12px;
  color: #666;
`;

const ResetButton = styled.button`
  padding: 6px 12px;
  background: transparent;
  border: 1px solid #7000FF;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  color: #7000FF;
  transition: all 0.2s ease;
  
  &:hover {
    background: #7000FF;
    color: white;
  }
  
  &:active {
    transform: scale(0.98);
  }
`;

const MessageList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 15px;
  display: flex;
  flex-direction: column;
`;

const MessageBubble = styled.div`
  max-width: 70%;
  padding: 10px 15px;
  border-radius: 15px;
  margin: 5px 0 20px;
  position: relative;
  ${props => props.$sender === 'user' 
    ? `
      background: #7000FF;
      color: white;
      align-self: flex-end;
      margin-left: auto;
    ` 
    : `
      background: #f0f0f0;
      color: black;
    `
  }
`;

const TimeStamp = styled.span`
  font-size: 10px;
  color: #666;
  position: absolute;
  bottom: -18px;
  ${props => props.$sender === 'user' 
    ? `right: 5px;` 
    : `left: 5px;`
  }
`;

const InputArea = styled.div`
  padding: 15px;
  display: flex;
  border-top: 1px solid #eee;
`;

const Input = styled.input`
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 20px;
  margin-right: 10px;
  &:disabled {
    background: #f5f5f5;
    cursor: not-allowed;
  }
`;

const SendButton = styled.button`
  padding: 10px 20px;
  background: #7000FF;
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  opacity: ${props => props.disabled ? 0.6 : 1};
  transition: all 0.2s ease;
  
  &:disabled {
    cursor: not-allowed;
  }
  
  &:hover:not(:disabled) {
    background: #5c00d2;
  }
`;

const PoweredBy = styled.div`
  text-align: center;
  padding: 10px;
  font-size: 12px;
  color: #666;
`;

const LoadingBubble = styled.div`
  max-width: 70%;
  padding: 15px;
  border-radius: 15px;
  background: #f0f0f0;
  margin: 5px 0;
  display: flex;
  align-items: center;
`;

const LoadingDots = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const Dot = styled.div`
  width: 8px;
  height: 8px;
  background: #666;
  border-radius: 50%;
  animation: bounce 1.4s infinite ease-in-out;
  animation-fill-mode: both;

  &:nth-child(1) {
    animation-delay: -0.32s;
  }

  &:nth-child(2) {
    animation-delay: -0.16s;
  }

  @keyframes bounce {
    0%, 80%, 100% { 
      transform: scale(0);
    } 
    40% { 
      transform: scale(1);
    }
  }
`;

const ChatInterface = () => {
  const [messages, setMessages] = useState([
    {
      text: "안녕하세요, 무엇을 도와드릴까요?",
      sender: 'bot',
      timestamp: '5:55 PM'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const messageListRef = React.useRef(null);

  const scrollToBottom = () => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMessage = {
      text: input,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await generateResponse(input);
      const botMessage = {
        text: response,
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 현재 날짜를 가져오는 함수
  const getCurrentDate = () => {
    const options = { month: 'long', day: 'numeric', year: 'numeric' };
    return new Date().toLocaleDateString('en-US', options);
  };

  return (
    <Container>
      <Header>
        <HeaderLeft>
          <Avatar />
          <HeaderText>
            <Title>AIWEB CHATBOT</Title>
            <Timestamp>{getCurrentDate()}</Timestamp>
          </HeaderText>
        </HeaderLeft>
        <ResetButton onClick={async () => {
          await resetConversation();
          setMessages([{
            text: "안녕하세요, 무엇을 도와드릴까요?",
            sender: 'bot',
            timestamp: '5:55 PM'
          }]);
        }}>
          새 대화
        </ResetButton>
      </Header>

      <MessageList ref={messageListRef}>
        {messages.map((message, index) => (
          <MessageBubble key={index} $sender={message.sender}>
            {message.text}
            <TimeStamp $sender={message.sender}>{message.timestamp}</TimeStamp>
          </MessageBubble>
        ))}
        {isLoading && (
          <LoadingBubble>
            <LoadingDots>
              <Dot />
              <Dot />
              <Dot />
            </LoadingDots>
          </LoadingBubble>
        )}
      </MessageList>

      <InputArea>
        <Input 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="메시지를 입력하세요..."
          disabled={isLoading}
        />
        <SendButton onClick={handleSend} disabled={isLoading}>
          전송
        </SendButton>
      </InputArea>
      <PoweredBy>Powered by gptkorea</PoweredBy>
    </Container>
  );
};

export default ChatInterface;