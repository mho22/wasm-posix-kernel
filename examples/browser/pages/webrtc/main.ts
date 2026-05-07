// Manual-SDP WebRTC DataChannel — handshake logic only.
//
// UI binding lives in the next stacked PR; this file exposes the
// driver functions on `window.rtc` so the handshake can be exercised
// from the dev console across two tabs.
//
// Manual copy-paste signaling fundamentally requires non-trickle ICE:
// every candidate must be embedded in the SDP blob the user pastes,
// since there is no out-of-band channel to ship trickled candidates.
// `gatheringComplete` is what gives us that guarantee.

const ICE_SERVERS: RTCIceServer[] = [{ urls: "stun:stun.l.google.com:19302" }];

let pc: RTCPeerConnection | null = null;
let dc: RTCDataChannel | null = null;

function setupPC(): RTCPeerConnection {
  const conn = new RTCPeerConnection({ iceServers: ICE_SERVERS });
  conn.addEventListener("connectionstatechange", () => {
    console.log("[webrtc] connectionState:", conn.connectionState);
  });
  conn.addEventListener("iceconnectionstatechange", () => {
    console.log("[webrtc] iceConnectionState:", conn.iceConnectionState);
  });
  conn.addEventListener("icegatheringstatechange", () => {
    console.log("[webrtc] iceGatheringState:", conn.iceGatheringState);
  });
  conn.addEventListener("datachannel", (ev) => {
    console.log("[webrtc] ondatachannel:", ev.channel.label);
    dc = ev.channel;
    wireDataChannel(dc);
  });
  return conn;
}

function gatheringComplete(conn: RTCPeerConnection): Promise<void> {
  return new Promise((resolve) => {
    if (conn.iceGatheringState === "complete") {
      resolve();
      return;
    }
    const check = () => {
      if (conn.iceGatheringState === "complete") {
        conn.removeEventListener("icegatheringstatechange", check);
        resolve();
      }
    };
    conn.addEventListener("icegatheringstatechange", check);
  });
}

function wireDataChannel(channel: RTCDataChannel): void {
  channel.addEventListener("open", () => {
    console.log("[webrtc] dc.open");
  });
  channel.addEventListener("message", (ev: MessageEvent) => {
    console.log("[webrtc] dc.message:", ev.data);
  });
  channel.addEventListener("close", () => {
    console.log("[webrtc] dc.close");
  });
  channel.addEventListener("error", (ev) => {
    console.error("[webrtc] dc.error:", ev);
  });
}

async function createOffer(): Promise<string> {
  reset();
  pc = setupPC();
  dc = pc.createDataChannel("kandelo");
  wireDataChannel(dc);
  await pc.setLocalDescription(await pc.createOffer());
  await gatheringComplete(pc);
  return JSON.stringify(pc.localDescription);
}

async function acceptOffer(remoteSdp: string): Promise<string> {
  reset();
  pc = setupPC();
  // dc arrives via pc.ondatachannel
  await pc.setRemoteDescription(JSON.parse(remoteSdp));
  await pc.setLocalDescription(await pc.createAnswer());
  await gatheringComplete(pc);
  return JSON.stringify(pc.localDescription);
}

async function acceptAnswer(remoteSdp: string): Promise<void> {
  if (!pc) throw new Error("no offer to accept answer for; call createOffer() first");
  await pc.setRemoteDescription(JSON.parse(remoteSdp));
}

function reset(): void {
  if (dc) {
    try { dc.close(); } catch { /* ignore */ }
    dc = null;
  }
  if (pc) {
    try { pc.close(); } catch { /* ignore */ }
    pc = null;
  }
}

(window as unknown as { rtc: unknown }).rtc = {
  createOffer,
  acceptOffer,
  acceptAnswer,
  reset,
  get pc() { return pc; },
  get dc() { return dc; },
};

console.log("[webrtc] loaded — drive the handshake from window.rtc");
