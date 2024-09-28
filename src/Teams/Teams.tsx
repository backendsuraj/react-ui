import React, { useState } from 'react';
import './Teams.css';

const Teams: React.FC = () => {
  document.title = "OnGoing Call";
  const participants = [
    { id: 1, name: 'You' },
    { id: 2, name: 'Alice' },
    { id: 3, name: 'Bob' },
    { id: 4, name: 'Charlie' },
    { id: 5, name: 'Dave' },
    { id: 6, name: 'Dave' },
    // Add more participants as needed
  ];

  const [simpleChatMessages, setSimpleChatMessages] = useState([
    { id: 1, sender: 'Alice', text: 'Hey, how is the meeting going?' },
    { id: 2, sender: 'Bob', text: 'It’s going well, thanks!' },
    { id: 3, sender: 'You', text: 'I just shared my screen.' },
    { id: 4, sender: 'Alice', text: 'Great, I can see it.' },
    { id: 5, sender: 'You', text: 'Perfect, let’s proceed then.' },
  ]); // Initial chat data
  
  const [newMessage, setNewMessage] = useState("");

  const meetingTime = '00:15:23'; // Example meeting time
  const isRecording = true;       // Example recording status

  // Number of participants per page (2 rows of 3 participants)
  const participantsPerPage = 6;
  const totalPages = Math.ceil(participants.length / participantsPerPage);
  const [chatType, setChatType] = useState('simple'); // 'simple' or 'ai'

  const renderParticipants = () => {
    if (participants.length <= 2) {
      if (participants.length === 1) {
        return (
          <div className="participant full">
            <div className="video-placeholder">
              <span className="initial">{participants[0].name.charAt(0)}</span>
              <span className="full-name">{participants[0].name}</span>
            </div>
          </div>
        );
      } else {
        const remoteParticipant = participants[1];
        const localParticipant = participants[0];
        return (
          <div className="participant-container">
            <div className="participant full">
              <div className="video-placeholder">
                <span className="initial">{remoteParticipant.name.charAt(0)}</span>
                <span className="full-name">{remoteParticipant.name}</span>
              </div>
            </div>
            <div className="participant local">
              <div className="video-placeholder">
                <span className="initial">{localParticipant.name.charAt(0)}</span>
                <span className="full-name">{localParticipant.name}</span>
              </div>
            </div>
          </div>
        );
      }
    } else {
      return (
        <div className="carousel-wrapper">
          {/* Radio inputs for carousel control */}
          {Array.from({ length: totalPages }, (_, i) => (
            <input
              type="radio"
              name="carousel"
              id={`carousel-${i}`}
              key={`input-${i}`}
              defaultChecked={i === 0}
            />
          ))}

          {/* Carousel pages */}
          {Array.from({ length: totalPages }, (_, i) => {
            const startIdx = i * participantsPerPage;
            const endIdx = startIdx + participantsPerPage;
            const pageParticipants = participants.slice(startIdx, endIdx);

            return (
              <div className="carousel-page" key={`page-${i}`}>
                <div className="participants-grid">
                  {pageParticipants.map((participant, idx) => (
                    <div key={participant.id} className={`participant card ${idx === 3 ? 'speaking' : ''}`}>
                      <div className="video-placeholder">
                        <span className="initial">{participant.name.charAt(0)}</span>
                        <span className="full-name">{participant.name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Carousel navigation dots */}
          <div className="carousel-navigation">
            {Array.from({ length: totalPages }, (_, idx) => (
              <label
                key={`nav-${idx}`}
                htmlFor={`carousel-${idx}`}
                className="carousel-dot"
              ></label>
            ))}
          </div>
        </div>
      );
    }
  };

  const renderChat = () => {
    if (chatType === 'simple') {
      return (
        <>
          <div className="chat-messages">
            {simpleChatMessages.map((message) => (
              <div key={message.id} className={`chat-message ${message.sender === 'You' ? 'my-message' : ''}`}>
                <strong>{message.sender}: </strong> {message.text}
              </div>
            ))}
          </div>
          <div className="chat-input">
            <input
              type="text"
              value={newMessage}
              placeholder="Type a message..."
              onChange={(e) => setNewMessage(e.target.value)}
            />
            <button
              onClick={() => {
                if (newMessage.trim()) {
                  setSimpleChatMessages([
                    ...simpleChatMessages,
                    { id: simpleChatMessages.length + 1, sender: 'You', text: newMessage }
                  ]);
                  setNewMessage("");
                }
              }}
            >
              Send
            </button>
          </div>
        </>
      );
    } else {
      return <div>AI Chat</div>;
    }
  };

  return (
    <div className="teams-call-ui">
      <header className="header">
        <div className="header-left">
          {isRecording && <span className="recording-icon"></span>}
          <span className="meeting-time">{meetingTime}</span>
        </div>
        <div className="header-right">
          <button className="header-button">Mute</button>
          <button className="header-button">Turn Video Off</button>
          <button className="header-button">Share Screen</button>
          <button className="header-button end-call">End Call</button>
        </div>
      </header>
      <div className="main-content">
        <div className="video-area">{renderParticipants()}</div>
        <div className="chat-area">
          {/* Toggle buttons for chat types */}
          <div className="chat-toggle">
            <button onClick={() => setChatType('simple')} className={chatType === 'simple' ? 'active' : ''}>
              Simple Chat
            </button>
            <button onClick={() => setChatType('ai')} className={chatType === 'ai' ? 'active' : ''}>
              AI Chat
            </button>
          </div>
          {/* Render the chat based on the selected type */}
          <div className="chat-content">
            {renderChat()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Teams;
