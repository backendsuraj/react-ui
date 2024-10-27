import React, { useEffect, useState } from 'react';
import './Teams.css';

const Teams: React.FC = () => {
  document.title = "OnGoing Call";
  const participants = [
    { id: 1, name: 'You' },
    { id: 2, name: 'Alice' },
    //{ id: 3, name: 'Bob' },
    // { id: 4, name: 'Charlie' },
    // { id: 5, name: 'Dave' },
    // { id: 6, name: 'Eve' },
    // { id: 6, name: 'Eve' },
    // { id: 6, name: 'Eve' },
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
      setIsLoading(true);
      setTimeout(() => {
        setChequeImage('/path-to-cheque-image.jpg');
        setIsLoading(false);
      }, 3000); // Simulated delay for image receipt
    } else if (serviceType === 'Cheque Encashment') {
      setChequeEncashmentStage('cardInserted'); // Start encashment journey
    }
  };

  const [chequeEncashmentStage, setChequeEncashmentStage] = useState<'loading' | 'cardInserted' | 'chequeInserted' | 'approval' | 'cashSelection' | 'success' | null>(null);

useEffect(() => {
  if (selectedService === 'Cheque Encashment') {
    setChequeEncashmentStage('loading');
    setTimeout(() => {
      setChequeEncashmentStage('cardInserted');
    }, 3000); // Simulate a 3-second delay for loading the card insertion
  }
}, [selectedService]);

  const [cashDenominations, setCashDenominations] = useState([
    { denomination: 100, quantity: 500 },
    { denomination: 500, quantity: 200 },
    { denomination: 2000, quantity: 50 },
  ]);

  const [notesToDispense, setNotesToDispense] = useState({ 100: 0, 500: 0, 2000: 0 });

  

  const renderParticipants = () => {
    const remoteParticipants = participants.slice(1); // Exclude local participant
    const totalPages = Math.ceil(remoteParticipants.length / participantsPerPage);
    const pagesArray = Array.from({ length: totalPages }, (_, i) => i);
  
    return (
      <div className="participant-container">
        {/* Always render local participant */}
        <div className={`participant local ${remoteParticipants.length === 0 ? 'full' : ''}`}>
          <div className="video-placeholder">
            <span className="initial">{participants[0].name.charAt(0)}</span>
            <span className="full-name">{participants[0].name}</span>
          </div>
        </div>
  
        {/* Render remote participants based on their count */}
        {remoteParticipants.length === 0 ? null : remoteParticipants.length <= 2 ? (
          remoteParticipants.map((participant) => (
            <div key={participant.id} className={`participant ${remoteParticipants.length === 1 ? 'full' : 'half'}`}>
              <div className="video-placeholder">
                <span className="initial">{participant.name.charAt(0)}</span>
                <span className="full-name">{participant.name}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="carousel-wrapper">
            {pagesArray.map((pageIndex) => (
              <>
                <input
                  type="radio"
                  name="carousel"
                  id={`carousel-${pageIndex}`}
                  key={`input-${pageIndex}`}
                  defaultChecked={pageIndex === 0}
                />
                <div className="carousel-page" key={`page-${pageIndex}`}>
                  <div className="participants-grid">
                    {remoteParticipants
                      .slice(pageIndex * participantsPerPage, (pageIndex + 1) * participantsPerPage)
                      .map((participant) => (
                        <div key={participant.id} className="participant card">
                          <div className="video-placeholder">
                            <span className="initial">{participant.name.charAt(0)}</span>
                            <span className="full-name">{participant.name}</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </>
            ))}
            <div className="carousel-navigation">
              {pagesArray.map((pageIndex) => (
                <label key={`nav-${pageIndex}`} htmlFor={`carousel-${pageIndex}`} className="carousel-dot"></label>
              ))}
            </div>
          </div>
        )}
      </div>
    );
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

  const renderChequeEncashmentJourney = () => {
    switch (chequeEncashmentStage) {
      case 'loading':
        return (
          <div className="loader-container">
            <div className="loader"></div>
            <p>Loading...</p>
          </div>
        );
        case 'cardInserted':
          setTimeout(() => setChequeEncashmentStage('chequeInserted'), 3000); // Automatically proceed after 3 seconds
          return (
            <div>
              <h3>Debit Card Inserted</h3>
              <div className="sample-card">
                <div className="chip"></div> {/* Chip icon */}
                <div className="card-number">1234 5678 9012 3456</div>
                <div className="card-expiry">
                  <span>Expiry: 12/25</span>
                </div>
                <div className="card-holder">
                  <span>John Doe</span>
                </div>
                <div className="visa-logo">VISA</div> {/* Optional card logo */}
              </div>
            </div>
          );        
      case 'chequeInserted':
        setTimeout(() => setChequeEncashmentStage('approval'), 3000); // Automatically proceed after 3 seconds
        return (
          <div>
            <h3>Cheque Inserted</h3>
            <div className="loader-container">
              <div className="loader"></div>
              <p>Verifying cheque...</p>
            </div>
          </div>
        );
      case 'approval':
        setTimeout(() => setChequeEncashmentStage('cashSelection'), 3000); // Automatically proceed after 3 seconds
        return (
          <div>
            <h3>Cheque Approved by Teller</h3>
            <div className="loader-container">
              <div className="loader"></div>
              <p>Loading cash options...</p>
            </div>
          </div>
        );
      case 'cashSelection':
        return (
          <div>
            <h3>Select the number of notes to dispense:</h3>
            <table>
              <thead>
                <tr>
                  <th>Denomination</th>
                  <th>Available</th>
                  <th>Number to Dispense</th>
                </tr>
              </thead>
              <tbody>
                {cashDenominations.map((denomination) => (
                  <tr key={denomination.denomination}>
                    <td>{denomination.denomination}</td>
                    <td>{denomination.quantity}</td>
                    <td>
                      <input
                        type="text"
                        value={notesToDispense[denomination.denomination]}
                        onChange={(e) =>
                          setNotesToDispense({
                            ...notesToDispense,
                            [denomination.denomination]: Number(e.target.value),
                          })
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button onClick={() => setChequeEncashmentStage('success')} className="accept-button">Dispense Cash</button>
          </div>
        );
      case 'success':
        return <h3>Cash dispensed successfully!</h3>;
      default:
        return null;
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

    {selectedService === 'Cheque Encashment' && renderChequeEncashmentJourney()}
  </div>
)}










    </div>
  );
};

export default Teams;
