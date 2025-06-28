import React from "react";
import {
  useTracks,
  ParticipantTile,
  TrackReference,
} from "@livekit/components-react";
import { Track } from "livekit-client";

const PiPLayout: React.FC = () => {
  const tracks = useTracks(
    [{ source: Track.Source.Camera, withPlaceholder: true }],
    { onlySubscribed: true },
  );

  const local  = tracks.find(t => t.participant.isLocal);
  const remote = tracks.find(t => !t.participant.isLocal);

  return (
    <div className="relative w-full h-full">
      {/* Remote (full) */}
      {remote && (
        <ParticipantTile
          key={remote.publication?.trackSid ?? remote.participant.sid}
          trackRef={remote as TrackReference}
          className="absolute inset-0 object-cover"
          disableSpeakingIndicator
        />
      )}

      {/* Local (PiP) */}
      {local && (
        <div className="absolute bottom-4 right-4 w-36 h-28 sm:w-40 sm:h-32
                        bg-gray-800 rounded overflow-hidden border border-white shadow-lg">
          <ParticipantTile
            key={local.publication?.trackSid ?? local.participant.sid}
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
