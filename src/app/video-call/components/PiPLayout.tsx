import React from "react";
import {
  useTracks,
  ParticipantTile,
  TrackReference,
} from "@livekit/components-react";
import { Track } from "livekit-client"; // ✅ fix here

export const PiPLayout = () => {
  const tracks = useTracks([
    { source: Track.Source.Camera, withPlaceholder: false },
  ]).filter((ref) => ref.publication?.isSubscribed);

  const localTrack = tracks.find((ref) => ref.participant.isLocal);
  const remoteTrack = tracks.find((ref) => !ref.participant.isLocal);

  return (
    <div className="relative w-full h-full bg-black">
      {remoteTrack && (
        <ParticipantTile
          trackRef={remoteTrack as TrackReference}
          className="w-full h-full object-cover"
        />
      )}

      {localTrack && (
        <div className="absolute bottom-4 right-4 w-40 h-32 z-10 rounded overflow-hidden shadow-lg border border-white">
          <ParticipantTile
            trackRef={localTrack as TrackReference}
            className="w-full h-full object-cover"
            disableSpeakingIndicator
          />
        </div>
      )}
    </div>
  );
};
