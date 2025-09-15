import { createLocalVideoTrack } from 'livekit-client';
import { BackgroundBlur, VirtualBackground } from '../src';
import { HighlightPersonProcessor } from '../src/HighlightPersonProcessor';

let videoTrack: any = null;

const initLivekit = async () => {
    videoTrack = await createLocalVideoTrack();
    const videoElm: any = document.getElementById('localVideo');
    videoTrack.attach(videoElm);
}

const actions = {
    enableBlur: async () => {
        const blur = BackgroundBlur(50);
        await videoTrack.setProcessor(blur);
    },
    changeBg: async () => {
        const bg = VirtualBackground('./bg-img1.jpg');
        await videoTrack.setProcessor(bg); 
    },
    enableAI: async () => {
        const green = HighlightPersonProcessor({});
        await videoTrack.setProcessor(green);
    }
}

initLivekit();

declare global {
    interface Window {
      currentRoom: any;
      appAction: typeof actions;
    }
  }
  
  window.appAction = actions;