'use client';
import { useEffect } from 'react';
import ChatWidget from '../../components/ChatWidget';

export default function WidgetPage() {
  useEffect(() => {
    // Make html and body transparent when this component mounts
    document.documentElement.style.backgroundColor = 'transparent';
    document.body.style.backgroundColor = 'transparent';
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    
    // Cleanup function to restore original styles (optional)
    return () => {
      document.documentElement.style.backgroundColor = '';
      document.body.style.backgroundColor = '';
      document.body.style.margin = '';
      document.body.style.padding = '';
    };
  }, []);

  return (
    <main
      className="h-screen w-screen bg-transparent overflow-hidden m-0 p-0"
      style={{
        backgroundColor: 'transparent',
        margin: 0,
        padding: 0,
      }}
    >
      <ChatWidget />
    </main>
  );
}