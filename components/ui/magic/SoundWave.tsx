export const SoundWave = ({ dark }: { dark?: boolean}) => {
    const wrapperStyle = {
        margin: 'auto',
    };

    const soundWaveStyle = {
        display: 'flex',
    };

    const soundBarStyle = {
        width: '2px',
        height: '2px',
        backgroundColor: dark ? '#ffffff' : '#505861',
        marginRight: '2px',
        transform: 'scaleY(1)',
        animationIterationCount: 'infinite',
        animationDirection: 'alternate',
        animationTimingFunction: 'cubic-bezier(0.42, 0, 0.58, 1)',
    };

    return (
        <div style={wrapperStyle}>
            <style jsx global>{`
          @keyframes bar-scale-sm {
            0%, 50% { transform: scaleY(1) }
            25% { transform: scaleY(6) }
            75% { transform: scaleY(4) }
          }
  
          @keyframes bar-scale-md {
            0%, 50% { transform: scaleY(2) }
            25% { transform: scaleY(6)  }
            75% { transform: scaleY(5) }
          }
  
          @keyframes bar-scale-lg {
            0%, 50% { transform: scaleY(8) }
            25% { transform: scaleY(4) }
            75% { transform: scaleY(6) }
          }
  
          @keyframes bar-scale-xl {
            0%, 50% { transform: scaleY(1) }
            25% { transform: scaleY(7)  }
            75% { transform: scaleY(11) }
          }
  
          @keyframes bar-scale-default {
            0%, 50% { transform: scaleY(1) }
            25% { transform: scaleY(3) }
            75% { transform: scaleY(2) }
          }
        `}</style>
            <div style={soundWaveStyle}>
                {Array.from({ length: 10 }).map((_, index) => {
                    let animationName = 'bar-scale-default';
                    let animationDuration = '0.5s';

                    if ((index + 1) % 4 === 0) {
                        animationName = 'bar-scale-xl';
                        animationDuration = '1s'; // Adjusted duration
                    } else if (index + 1 === 4) {
                        animationName = 'bar-scale-xl';
                        animationDuration = '1.15s'; // Adjusted duration
                    } else if (index + 1 === 3) {
                        animationName = 'bar-scale-lg';
                        animationDuration = '0.8s'; // Adjusted duration
                    } else if (index + 1 === 6) {
                        animationName = 'bar-scale-md';
                        animationDuration = '0.85s'; // Adjusted duration
                    } else if ([2, 5, 7, 9].includes(index + 1)) {
                        animationName = 'bar-scale-sm';
                        animationDuration = '0.9s';
                    }

                    return (
                        <div
                            key={index}
                            style={{
                                ...soundBarStyle,
                                animationName: animationName,
                                animationDuration: animationDuration,
                                animationPlayState: 'running', // Ensure animation is running
                            }}
                        ></div>
                    );
                })}
            </div>
        </div>
    );
};
