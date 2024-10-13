import React, { useState } from 'react';
import './Teams.css';

const Teams: React.FC = () => {
  document.title = "OnGoing Call";
  const participants = [
    { id: 1, name: 'You' },
    { id: 2, name: 'Alice' },
    // { id: 3, name: 'Bob' },
    // { id: 4, name: 'Charlie' },
    // { id: 5, name: 'Dave' },
    // { id: 6, name: 'Eve' },
  ];

  const [simpleChatMessages, setSimpleChatMessages] = useState([
    { id: 1, sender: 'Alice', text: 'Hey, how is the meeting going?' },
    { id: 2, sender: 'Bob', text: 'It’s going well, thanks!' },
    { id: 3, sender: 'You', text: 'I just shared my screen.' },
    { id: 4, sender: 'Alice', text: 'Great, I can see it.' },
    { id: 5, sender: 'You', text: 'Perfect, let’s proceed then.' },
  ]); 

  const [newMessage, setNewMessage] = useState("");
  const meetingTime = '00:15:23'; 
  const isRecording = true;
  const participantsPerPage = 6;
  const totalPages = Math.ceil(participants.length / participantsPerPage);
  const [chatType, setChatType] = useState('simple');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // State for sidebar
  const [selectedService, setSelectedService] = useState(''); // Track selected service
  const [chequeImage, setChequeImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleServiceSelection = (serviceType: string) => {
    setSelectedService(serviceType);
    if (serviceType === 'Cheque Deposit') {
      // Simulate receiving the cheque image with loading
      setIsLoading(true);
      setTimeout(() => {
        setChequeImage('/path-to-cheque-image.jpg'); // Replace with actual image path
        setIsLoading(false);
      }, 3000); // Simulated delay for image receipt
    }
  };

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
          {Array.from({ length: totalPages }, (_, i) => (
            <input
              type="radio"
              name="carousel"
              id={`carousel-${i}`}
              key={`input-${i}`}
              defaultChecked={i === 0}
            />
          ))}

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
          <button className="header-button" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>Services</button>
        </div>
      </header>

      <div className="main-content">
        <div className="video-area">{renderParticipants()}</div>
        <div className="chat-area">
          <div className="chat-toggle">
            <button onClick={() => setChatType('simple')} className={chatType === 'simple' ? 'active' : ''}>
              Simple Chat
            </button>
            <button onClick={() => setChatType('ai')} className={chatType === 'ai' ? 'active' : ''}>
              AI Chat
            </button>
          </div>
          <div className="chat-content">
            {renderChat()}
          </div>
        </div>
      </div>

      {/* Sidebar for services */}
      {isSidebarOpen && (
  <div className="services-sidebar">
    <div className="services-top-bar">
      <h2>Select Service</h2>
      <button className="close-button" onClick={() => setIsSidebarOpen(false)}>×</button>
    </div>

    {/* Dropdown for service selection */}
    <div className="service-dropdown">
      <label htmlFor="serviceSelect">Choose a service:</label>
      <select id="serviceSelect" onChange={(e) => handleServiceSelection(e.target.value)}>
        <option value="">-- Select a Service --</option>
        <option value="Cheque Deposit">Cheque Deposit</option>
        <option value="Cheque Encashment">Cheque Encashment</option>
        {/* Add more services as needed */}
      </select>
    </div>

    {selectedService && (
      <div className="service-status">
        <p>Selected Service: {selectedService}</p>
        {isLoading ? (
          <div className="loader-container">
            <div className="loader"></div> {/* Loader */}
          </div>
        ) : (
          chequeImage && (
            <>
              <img src="https://via.placeholder.com/800x200" alt="Cheque" className="cheque-image" />

              {/* Accept and Decline Buttons */}
              <div className="cheque-action-buttons">
                <button onClick={() => alert("Cheque Accepted")} className="accept-button">
                  Accept
                </button>
                <button onClick={() => alert("Cheque Declined")} className="decline-button">
                  Decline
                </button>
              </div>
            </>
          )
        )}
      </div>
    )}
  </div>
)}










    </div>
  );
};

export default Teams;
