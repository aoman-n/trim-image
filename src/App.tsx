import React from 'react';
import styled from 'styled-components';
import TrimImage from './TrimImage';

const App: React.FC = () => {
  return (
    <Container>
      <TrimImage />
    </Container>
  )
}

const Container = styled.div`
  padding: 20px;
`;

export default App;
