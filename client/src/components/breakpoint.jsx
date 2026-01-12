
import { useState, useEffect } from 'react';

export const useBreakpoint =()=> {
  const [breakpoint, setBreakpoint] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => {
      setBreakpoint(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return breakpoint;
  
}


export const useBreakpointHeight =()=> {
  const [breakpoint, setBreakpoint] = useState(window.innerHeight);

  useEffect(() => {
    const handleResize = () => {
      setBreakpoint(window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return breakpoint;
}
