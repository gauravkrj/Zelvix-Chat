//"chatwidget.js"
'use client';

import { useState, useRef, useEffect } from 'react';
import {
  FaPaperPlane,
  FaComments,
  FaFileUpload,
  FaUser,
} from 'react-icons/fa';

export default function ChatWidget() {
  const [config, setConfig] = useState(null);

  useEffect(() => {
    fetch('/chatConfig.json')
      .then((res) => res.json())
      .then(setConfig)
      .catch((err) => {
        console.error('Failed to load config:', err);
      });
  }, []);

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [open, setOpen] = useState(false);
  const [typing, setTyping] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [userName, setUserName] = useState('');


  const [isAwaitingName, setIsAwaitingName] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [nameError, setNameError] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    const savedName = localStorage.getItem('userName');
    if (savedName) {
      setUserName(savedName);
      setIsAwaitingName(false);
    } else {
      setIsAwaitingName(true);
    }
  }, []);

  const parseTemplate = (template, vars = {}) =>
    template.replace(/\{(\w+)\}/g, (_, key) => vars[key] || '');

  useEffect(() => {
    if (!config) return;

    if (open) {
      if (userName) {
        if (messages.length === 0) {
          const text = parseTemplate(config.welcomeMessages.welcomeBack, { userName });
          const welcomeMessage = {
            sender: 'bot',
            text,
            time: new Date().toLocaleTimeString(),
          };
          setMessages([welcomeMessage]);
        }
      } else {
        setShowNameModal(true);
        setIsAwaitingName(true);
        if (messages.length === 0) {
          const text = parseTemplate(config.welcomeMessages.askName, { botName: config.botName });
          const welcomeMessage = {
            sender: 'bot',
            text,
            time: new Date().toLocaleTimeString(),
          };
          setMessages([welcomeMessage]);
        }
      }
    }
  }, [open, userName, messages.length, config]);

  const validateName = (name) => {
    if (!name.trim()) return 'Name cannot be empty';
    if (!/^[a-zA-Z\s]+$/.test(name)) return 'Name can only contain letters and spaces';
    return '';
  };

  const handleNameSubmit = () => {
    const error = validateName(nameInput);
    if (error) {
      setNameError(error);
      return;
    }
    setUserName(nameInput.trim());
    localStorage.setItem('userName', nameInput.trim());
    setIsAwaitingName(false);
    setShowNameModal(false);
    setNameInput('');
    setNameError('');

    const text = parseTemplate(config.welcomeMessages.nameConfirmation, { userName: nameInput.trim() });

    const botReply = {
      sender: 'bot',
      text,
      time: new Date().toLocaleTimeString(),
    };
    setMessages((prev) => [...prev, botReply]);
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    if (input.trim().toLowerCase() === '/change-name') {
      setShowNameModal(true);
      setIsAwaitingName(true);
      setInput('');
      return;
    }

    const userMessage = {
      sender: 'user',
      text: input,
      time: new Date().toLocaleTimeString(),
    };
    setMessages((prev) => [...prev, userMessage]);

    const messageText = input.trim();
    setInput('');
    setTyping(true);

    if (isAwaitingName) {
      setTyping(false);
      setShowNameModal(true);
      return;
    }

    try {
      const res = await fetch(config.apiEndpoints.chat, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: `${userName ? userName + ': ' : ''}${messageText}` }),
      });

      const data = await res.json();
      const botMessage = {
        sender: 'bot',
        text: data.reply,
        time: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = {
        sender: 'bot',
        text: 'Sorry, something went wrong. Please try again later.',
        time: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setTyping(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    setUploading(true);

    const userMessage = {
      sender: 'user',
      text: `Uploaded: ${file.name}`,
      file,
      time: new Date().toLocaleTimeString(),
    };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const res = await fetch(config.apiEndpoints.upload, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      const botMessage = {
        sender: 'bot',
        text: data.preview,
        time: new Date().toLocaleTimeString(),
        fileUrl: data.fileUrl,
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error('Upload error:', error);
      const errorMsg = {
        sender: 'bot',
        text: 'Failed to upload file. Please try again.',
        time: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setUploading(false);
    }
  };

  if (!config) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {open ? (
        <div className="w-80 h-[500px] bg-dark text-light shadow-xl rounded-xl flex flex-col overflow-hidden border border-gray-700">
          <div className="bg-primary text-white p-3 font-semibold flex justify-between items-center">
            Zelvix - Chat with {config.botName}
            <button onClick={() => setOpen(false)}>✕</button>
          </div>

          <div className="bg-dark p-2 border-b border-gray-700">
            <div className="flex gap-2">
              {config.buttons.map(({ label, url }, i) => (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-1/2 text-center text-sm px-3 py-2 bg-primary text-light rounded hover:bg-hovercolor transition"
                >
                  {label}
                </a>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex items-start gap-2 ${
                  msg.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.sender === 'bot' && (
                  <img
                    src={config.botAvatar}
                    alt={config.botName}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                )}

                <div
                  className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                    msg.sender === 'user'
                      ? 'bg-primary text-white order-1'
                      : 'bg-midDark text-light border border-gray-700'
                  }`}
                >
                  {msg.file ? (
                    <div>
                      <p className="mb-1 font-semibold">{msg.text}</p>
                      {msg.file.type.startsWith('image') && (
                        <img
                          src={URL.createObjectURL(msg.file)}
                          alt="preview"
                          className="max-w-full h-auto rounded"
                        />
                      )}
                    </div>
                  ) : (
                    <p>{msg.text}</p>
                  )}
                  {msg.fileUrl && (
                    <a
                      href={msg.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block mt-1 text-xs underline text-blue-400"
                    >
                      View Uploaded File
                    </a>
                  )}
                  <span className="text-xs text-gray-200 block mt-1 text-right">{msg.time}</span>
                </div>

                {msg.sender === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-white order-2">
                    <FaUser />
                  </div>
                )}
              </div>
            ))}
            {typing && (
              <div className="text-sm text-gray-400 italic">
                {parseTemplate(config.ui.typingIndicator, { botName: config.botName })}
              </div>
            )}
            {uploading && <div className="text-sm text-yellow-400 italic">Uploading...</div>}
          </div>

          <div className="p-3 bg-midDark flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type a message..."
              className="flex-1 p-2 text-sm rounded-lg bg-dark text-light border border-gray-600 focus:outline-none"
              disabled={isAwaitingName}
            />
            <button
              onClick={() => fileInputRef.current.click()}
              className="bg-primary p-2 rounded-full text-light hover:bg-hovercolor"
              disabled={isAwaitingName}
              title={isAwaitingName ? 'Please enter your name first' : 'Upload File'}
            >
              <FaFileUpload size={16} />
            </button>
            <button
              onClick={handleSend}
              className="bg-primary p-2 rounded-full text-light hover:bg-hovercolor"
              disabled={isAwaitingName}
              title={isAwaitingName ? 'Please enter your name first' : 'Send Message'}
            >
              <FaPaperPlane size={16} />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept=".pdf,.docx,.xlsx,image/*"
            />
          </div>

          {showNameModal && (
            <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center transition-opacity duration-300">
              <div className="bg-dark p-6 rounded-lg w-72 shadow-lg text-center">
                <h2 className="text-lg font-semibold mb-4 text-white">Please enter your name</h2>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => {
                    setNameInput(e.target.value);
                    if (nameError) setNameError('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleNameSubmit();
                  }}
                  className="w-full p-2 rounded border border-gray-600 bg-midDark text-light focus:outline-none mb-2"
                  placeholder="Your name"
                  autoFocus
                />
                {nameError && <p className="text-xs text-red-500 mb-2">{nameError}</p>}
                <button
                  onClick={handleNameSubmit}
                  className="bg-primary text-white px-4 py-2 rounded hover:bg-accent transition"
                >
                  Submit
                </button>
              </div>
            </div>
          )}

          {/* 👇 Added footer */}
          <div className="text-center text-xs text-gray-500 py-2 bg-dark border-t border-gray-700">
            Powered by <a href="https://dgwrench.com" target="_blank" className="text-accent hover:underline">Dgwrench</a>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="bg-primary text-white p-4 rounded-full shadow-lg hover:bg-accent transition-all"
          title="Open chat"
        >
          <FaComments size={20} />
        </button>
      )}
    </div>
  );
}
