import React from 'react';
import { keyframes } from '@emotion/react';
import { Box } from '@mui/material';
import { styled } from '@mui/material/styles';

// Definizione precisa dei tipi per le props
interface LoadingSkeletonProps {
  className?: string;
  count?: number;
  type?: 'wave' | 'pulse';
  height?: string | number;
  width?: string | number;
}

// Definizione delle animazioni
const pulseKeyframe = keyframes`
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
  100% {
    opacity: 1;
  }
`;

const waveKeyframe = keyframes`
  0% {
    transform: scaleY(0.3);
  }
  50% {
    transform: scaleY(1);
  }
  100% {
    transform: scaleY(0.3);
  }
`;

// Styled components per una migliore organizzazione del codice
const SkeletonPulse = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
  borderRadius: theme.shape.borderRadius,
  animation: `${pulseKeyframe} 1.5s ease-in-out infinite`,
}));

const SkeletonWave = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
  borderRadius: theme.shape.borderRadius,
  animation: `${waveKeyframe} 1.2s ease-in-out infinite`,
  transformOrigin: 'bottom',
}));

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  className = '',
  count = 1,
  type = 'wave',
  height = '2rem',
  width = '100%'
}) => {
  const SkeletonComponent = type === 'wave' ? SkeletonWave : SkeletonPulse;

  if (type === 'wave') {
    return (
      <Box 
        sx={{ 
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          height: typeof height === 'number' ? `${height}px` : height
        }}
      >
        {[...Array(count)].map((_, index) => (
          <Box key={index} sx={{ display: 'flex', alignItems: 'flex-end', gap: 0.5 }}>
            {[...Array(3)].map((_, barIndex) => (
              <SkeletonComponent
                key={`${index}-${barIndex}`}
                className={className}
                sx={{
                  width: '4px',
                  height: '100%',
                  animationDelay: `${index * 0.2 + barIndex * 0.1}s`
                }}
              />
            ))}
          </Box>
        ))}
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {[...Array(count)].map((_, index) => (
        <SkeletonComponent
          key={index}
          className={className}
          sx={{
            width: typeof width === 'number' ? `${width}px` : width,
            height: typeof height === 'number' ? `${height}px` : height
          }}
        />
      ))}
    </Box>
  );
};

export default LoadingSkeleton; 