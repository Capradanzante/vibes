import React from 'react';
import './LoadingSkeleton.css';

const LoadingSkeleton = ({ type = 'card', count = 1 }) => {
  const skeletons = Array(count).fill(0);

  return (
    <div className="skeleton-container">
      {skeletons.map((_, index) => (
        <div key={index} className={`skeleton ${type}`}>
          <div className="skeleton-pulse"></div>
        </div>
      ))}
    </div>
  );
};

export default LoadingSkeleton; 