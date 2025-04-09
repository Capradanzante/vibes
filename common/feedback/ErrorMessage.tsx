import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { keyframes } from '@emotion/react';
import { styled } from '@mui/material/styles';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import MusicOffIcon from '@mui/icons-material/MusicOff';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

// Definizione precisa dei tipi
interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  mood?: 'calm' | 'energetic';
  type?: 'music' | 'general' | 'connection';
  severity?: 'error' | 'warning';
  title?: string;
  description?: string;
  retryText?: string;
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
  from { 
    opacity: 0; 
    transform: translateY(-10px); 
    filter: blur(5px);
  }
  to { 
    opacity: 1; 
    transform: translateY(0);
    filter: blur(0);
  }
`;

// Styled components per una migliore organizzazione
const ErrorContainer = styled(Paper, {
  shouldForwardProp: (prop) => !['mood', 'severity'].includes(prop as string)
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
      boxShadow: theme.shadows[4]
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

const IconWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '64px',
  height: '64px',
  borderRadius: '50%',
  backgroundColor: theme.palette.mode === 'dark' 
    ? 'rgba(255, 255, 255, 0.05)'
    : 'rgba(0, 0, 0, 0.05)',
  marginBottom: theme.spacing(2)
}));

const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  onRetry,
  mood = 'calm',
  type = 'general',
  severity = 'error',
  title,
  description,
  retryText = 'Riprova'
}) => {
  const getIcon = () => {
    switch (type) {
      case 'music':
        return <MusicOffIcon sx={{ fontSize: 32 }} />;
      case 'connection':
        return <WarningAmberIcon sx={{ fontSize: 32 }} />;
      default:
        return <ErrorOutlineIcon sx={{ fontSize: 32 }} />;
    }
  };

  return (
    <ErrorContainer mood={mood} severity={severity}>
      <IconWrapper
        sx={{ 
          color: severity === 'warning' ? 'warning.main' : 'error.main',
          animation: mood === 'energetic' 
            ? `${shakeKeyframes} 0.5s ease-in-out`
            : 'none'
        }}
      >
        {getIcon()}
      </IconWrapper>
      
      {title && (
        <Typography 
          variant="h5" 
          align="center"
          sx={{ 
            color: 'text.primary',
            fontWeight: 600
          }}
        >
          {title}
        </Typography>
      )}

      <Typography 
        variant="body1" 
        align="center"
        sx={{ 
          color: 'text.primary',
          maxWidth: '80%',
          marginBottom: 1
        }}
      >
        {message}
      </Typography>

      {description && (
        <Typography 
          variant="body2" 
          align="center"
          sx={{ 
            color: 'text.secondary',
            maxWidth: '70%'
          }}
        >
          {description}
        </Typography>
      )}

      {onRetry && (
        <RetryButton
          variant="outlined"
          color={severity === 'warning' ? 'warning' : 'error'}
          onClick={onRetry}
          size="large"
          startIcon={getIcon()}
        >
          {retryText}
        </RetryButton>
      )}
    </ErrorContainer>
  );
};

export default ErrorMessage; 