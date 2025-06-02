'use client';

import ChatWidget from '../components/ChatWidget';

export default function WidgetPage() {
  return (
    <div className="h-screen w-screen overflow-hidden bg-transparent">
      <ChatWidget />
    </div>
  );
}