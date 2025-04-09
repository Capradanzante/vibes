import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { keyframes } from '@emotion/react';
import { styled } from '@mui/material/styles';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import MusicOffIcon from '@mui/icons-material/MusicOff';

// Definizione precisa dei tipi
interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  mood?: 'calm' | 'energetic';
  type?: 'music' | 'general';
  severity?: 'error' | 'warning';
}

// Animazioni sofisticate
const shakeKeyframes = keyframes`
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-10px); }
  40% { transform: translateX(10px); }
  60% { transform: translateX(-5px); }
  80% { transform: translateX(5px); }
`;

const fadeInKeyframes = keyframes`
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
`;

// Styled components per una migliore organizzazione
const ErrorContainer = styled(Paper, {
  shouldForwardProp: (prop) => prop !== 'mood' && prop !== 'severity'
})<{ mood?: 'calm' | 'energetic'; severity?: 'error' | 'warning' }>(
  ({ theme, mood, severity }) => ({
    padding: theme.spacing(4),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: theme.spacing(2),
    backgroundColor: theme.palette.mode === 'dark' 
      ? theme.palette.grey[900]
      : theme.palette.grey[50],
    border: `1px solid ${
      severity === 'warning' 
        ? theme.palette.warning.main 
        : theme.palette.error.main
    }`,
    animation: `${mood === 'energetic' ? shakeKeyframes : fadeInKeyframes} ${
      mood === 'energetic' ? '0.5s' : '0.3s'
    } ease-in-out`,
    transition: 'all 0.3s ease-in-out',
    '&:hover': {
      transform: mood === 'energetic' ? 'scale(1.02)' : 'none',
    }
  })
);

const RetryButton = styled(Button)(({ theme }) => ({
  borderRadius: '20px',
  padding: '8px 24px',
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    transform: 'scale(1.05)',
    boxShadow: theme.shadows[4]
  }
}));

const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  onRetry,
  mood = 'calm',
  type = 'general',
  severity = 'error'
}) => {
  const Icon = type === 'music' ? MusicOffIcon : ErrorOutlineIcon;

  return (
    <ErrorContainer mood={mood} severity={severity}>
      <Box sx={{ 
        color: severity === 'warning' ? 'warning.main' : 'error.main',
        animation: mood === 'energetic' 
          ? `${shakeKeyframes} 0.5s ease-in-out`
          : 'none'
      }}>
        <Icon sx={{ fontSize: 48 }} />
      </Box>
      
      <Typography 
        variant="h6" 
        align="center"
        sx={{ 
          color: 'text.primary',
          maxWidth: '80%',
          marginBottom: 1
        }}
      >
        {message}
      </Typography>

      {onRetry && (
        <RetryButton
          variant="outlined"
          color={severity === 'warning' ? 'warning' : 'error'}
          onClick={onRetry}
          size="large"
        >
          Riprova
        </RetryButton>
      )}
    </ErrorContainer>
  );
};

export default ErrorMessage; 