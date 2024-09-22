import React, { useState } from 'react';
import styles from './TellerScreen.module.css';

const TellerScreen = () => {
  const [username, setUsername] = useState('');
  const [incomingCalls, setIncomingCalls] = useState([
    { id: 1, machineId: 'ITM-1001', location: 'Downtown Branch' },
    { id: 2, machineId: 'ITM-1004', location: 'Eastside Branch' },
  ]);

  const [inProgressCalls, setInProgressCalls] = useState([
    { id: 3, machineId: 'ITM-1002', location: 'Uptown Branch', duration: '05:32' },
  ]);

  const handleAcceptCall = (callId) => {
    const call = incomingCalls.find((call) => call.id === callId);
    if (call) {
      setIncomingCalls(incomingCalls.filter((call) => call.id !== callId));
      setInProgressCalls([...inProgressCalls, { ...call, duration: '00:00' }]);
    }
  };

  const handleJoin = () => {
    if (username.trim()) {
      alert(`Teller ${username} joined!`);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.dashboardTitle}>Teller Dashboard</h1>
      </header>

      {/* Username input and Join button */}
      <div className={styles.joinSection}>
        <input
          type="text"
          placeholder="Enter Teller Username"
          className={styles.usernameInput}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <button className={styles.joinButton} onClick={handleJoin}>
          Join
        </button>
      </div>

      <div className={styles.mainContent}>
        <section className={styles.tableSection}>
          <h2 className={styles.sectionTitle}>Incoming Calls</h2>
          <table className={styles.callTable}>
            <thead>
              <tr>
                <th>ITM Machine No</th>
                <th>Location</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {incomingCalls.length > 0 ? (
                incomingCalls.map((call) => (
                  <tr key={call.id}>
                    <td>{call.machineId}</td>
                    <td>{call.location}</td>
                    <td>
                      <button
                        className={styles.acceptButton}
                        onClick={() => handleAcceptCall(call.id)}
                      >
                        Accept
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className={styles.noCalls}>
                    No incoming calls.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        <section className={styles.tableSection}>
          <h2 className={styles.sectionTitle}>In Progress Calls</h2>
          <table className={styles.callTable}>
            <thead>
              <tr>
                <th>ITM Machine No</th>
                <th>Location</th>
                <th>Duration</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {inProgressCalls.length > 0 ? (
                inProgressCalls.map((call) => (
                  <tr key={call.id}>
                    <td>{call.machineId}</td>
                    <td>{call.location}</td>
                    <td>{call.duration}</td>
                    <td className={styles.actionGroup}>
                      <button className={styles.joinButton}>Join</button>
                      <button className={styles.superviseButton}>Supervise</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className={styles.noCalls}>
                    No in-progress calls.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
};

export default TellerScreen;
