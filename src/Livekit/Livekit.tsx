import './Livekit.css';
import React, { useEffect, useRef, useState } from 'react';
import { 
	RemoteParticipant, 
	RemoteTrack,
	RemoteTrackPublication, 
	Room, 
	RoomEvent, 
	RoomOptions, 
	Track, 
	VideoPresets,
	Participant,
  LocalParticipant,
  TrackPublication,
	setLogLevel
} from 'livekit-client';
const wsUrl = 'ws://13.127.251.248:7880';



export const LiveKit = () => {

	const roomOptions: RoomOptions = {
		// Capture settings: how media is captured, including device selection and capabilities.
		audioCaptureDefaults: {
			echoCancellation: true,
			noiseSuppression: true,
		},
		videoCaptureDefaults: {
			resolution: VideoPresets.h720.resolution,
		},
		// Publish settings: how it's encoded, including bitrate and framerate.
		publishDefaults: {
			videoCodec: 'vp8'
		},
	};

	const roomRef = useRef(null);
	const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
	const [participants, setParticipants] = useState<Participant[]>([]);

	const queryParams = new URLSearchParams(window.location.search);
	const authToken = queryParams.get('token')!;
	const isSupervisor = queryParams.get('isSupervisor')!;
	console.log('authToken', authToken);
	console.log('isSupervisor', isSupervisor);


	useEffect(() => {
		// @ts-ignore
		setLogLevel('debug');
		const connectToRoom = async () => {
			const room = new Room(roomOptions);
			await room.connect(wsUrl, authToken);
			if (!isSupervisor) {
				room.localParticipant.enableCameraAndMicrophone();
			}
			const updateParticipants = () => {
				console.log('************', room.remoteParticipants);
				setParticipants([room.localParticipant, ...Array.from(room.remoteParticipants.values())]);
				console.log("****PARTICPPCPC", participants);
			};
			room
				.on(RoomEvent.LocalTrackPublished, updateParticipants)
				.on(RoomEvent.TrackSubscribed, updateParticipants)
				.on(RoomEvent.TrackUnsubscribed, updateParticipants)
				.on(RoomEvent.ParticipantConnected, updateParticipants)
				.on(RoomEvent.ParticipantDisconnected, updateParticipants)
				.on(RoomEvent.Connected, updateParticipants);
			setParticipants([room.localParticipant, ...Array.from(room.remoteParticipants.values())]);

		}
		connectToRoom();
	}, []);

	return (
    <div>
      {participants.map((participant) => (
        <div key={participant.sid} style={{ marginBottom: '20px' }}>
          <h3>{participant.identity} {participant instanceof LocalParticipant ? '(You)' : ''}</h3>
          <video
            id={`video-${participant.sid}`}
            autoPlay
            playsInline
            ref={(video) => {
              const videoPub = participant.getTrackPublication(Track.Source.Camera);
              if (video && videoPub?.track && !videoPub.track.isMuted) {
                videoPub.track.attach(video);
              }
            }}
            style={{ width: '300px', height: 'auto', backgroundColor: '#000' }}
          />
          {/* <div>
            <button onClick={() => handleMuteAudio(participant)}>
              {participant.getTrack(Track.Source.Microphone)?.isMuted ? 'Unmute Audio' : 'Mute Audio'}
            </button>
            <button onClick={() => handleToggleVideo(participant)}>
              {participant.getTrack(Track.Source.Camera)?.isMuted ? 'Turn Video On' : 'Turn Video Off'}
            </button>
          </div> */}
        </div>
      ))}
    </div>
  );
}

