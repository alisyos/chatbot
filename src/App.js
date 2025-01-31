import React from 'react';
import ChatInterface from './components/ChatInterface';
import styled from 'styled-components';

function App() {
  return (
    <AppContainer>
      <ChatInterface />
    </AppContainer>
  );
}

const AppContainer = styled.div`
  min-height: 100vh;
  background-color: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export default App;
