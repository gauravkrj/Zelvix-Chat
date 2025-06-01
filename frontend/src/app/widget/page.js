'use client';
import ChatWidget from '../../components/ChatWidget';

export default function WidgetPage() {
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
