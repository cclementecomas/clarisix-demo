import { useState, useEffect, useRef } from 'react';
import { resolveGreeting, touchSession } from '../utils/greeting';

export default function Greeting() {
  const [text, setText] = useState('');
  const resolved = useRef(false);

  useEffect(() => {
    // Resolve once on mount — determines context from lastSession before updating it
    if (!resolved.current) {
      resolved.current = true;
      const { text: greeting } = resolveGreeting();
      setText(greeting);
    }

    // Keep session alive on visibility/focus changes
    const handleFocus = () => touchSession();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  if (!text) return null;

  return (
    <p className="text-2xl font-semibold text-gray-900 tracking-tight">
      {text}
    </p>
  );
}
