import React from "react";
import {
  useTracks,
  ParticipantTile,
  TrackReference,
} from "@livekit/components-react";
import { Track } from "livekit-client"; // 👈 important import

const PiPLayout: React.FC = () => {
  const tracks = useTracks([{ source: Track.Source.Camera, withPlaceholder: true }], {
    onlySubscribed: true,
  });

  const local = tracks.find((t) => t.participant.isLocal);
  const remote = tracks.find((t) => !t.participant.isLocal);

  return (
    <div className="relative w-full h-full bg-black">
      {remote && (
        <ParticipantTile
          key={remote.publication?.trackSid}
          trackRef={remote as TrackReference}
          className="absolute inset-0 object-cover"
          disableSpeakingIndicator
        />
      )}
      {local && (
        <div className="absolute bottom-4 right-4 w-40 h-32 rounded border border-white overflow-hidden shadow-lg z-10">
          <ParticipantTile
            key={local.publication?.trackSid}
            trackRef={local as TrackReference}
            className="w-full h-full object-cover"
            disableSpeakingIndicator
          />
        </div>
      )}
    </div>
  );
};

export default PiPLayout;
