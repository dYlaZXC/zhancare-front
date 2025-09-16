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
      {/* Remote participant (full screen) */}
      {remote && (
        <ParticipantTile
          key={remote.publication?.trackSid ?? remote.participant.sid}
          trackRef={remote as TrackReference}
          className="absolute inset-0 object-cover rounded-2xl"
          disableSpeakingIndicator
        />
      )}

      {/* Local participant (Picture-in-Picture) */}
      {local && (
        <div className="absolute bottom-20 right-4 w-48 h-36
                        bg-gray-900 rounded-xl overflow-hidden
                        border-2 border-white/30 shadow-2xl backdrop-blur-sm
                        transition-all duration-300 hover:scale-105 hover:border-white/50">
          <ParticipantTile
            key={local.publication?.trackSid ?? local.participant.sid}
            trackRef={local as TrackReference}
            className="w-full h-full object-cover rounded-xl"
            disableSpeakingIndicator
          />

          {/* Medical context indicator */}
          <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm
                          rounded-full px-2 py-1 text-xs text-white font-medium">
            {local.participant.identity?.includes('doctor') ? '👨‍⚕️ Врач' : '👤 Я'}
          </div>
        </div>
      )}

      {/* No participants placeholder */}
      {!remote && !local && (
        <div className="absolute inset-0 flex items-center justify-center
                        bg-gradient-to-br from-gray-800/50 to-gray-900/50
                        rounded-2xl backdrop-blur-sm">
          <div className="text-center text-white/70 p-8">
            <div className="text-6xl mb-4">🎥</div>
            <h3 className="text-xl font-semibold mb-2">Подключение к видеоконференции...</h3>
            <p className="text-sm">Ожидаем подключения участников</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PiPLayout;
