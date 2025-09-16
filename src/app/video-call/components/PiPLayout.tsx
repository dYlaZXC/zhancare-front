import React from "react";
import {
  useTracks,
  ParticipantTile,
  TrackReference,
  useLocalParticipant,
} from "@livekit/components-react";
import { Track } from "livekit-client";

const PiPLayout: React.FC = () => {
  const tracks = useTracks(
    [{ source: Track.Source.Camera, withPlaceholder: true }],
    { onlySubscribed: false }, // Include both subscribed and local tracks
  );

  const { localParticipant } = useLocalParticipant();

  // Debug logging
  React.useEffect(() => {
    console.log("🎥 PiPLayout - Tracks:", tracks.length);
    console.log("🎥 PiPLayout - Local participant:", localParticipant?.identity);
    tracks.forEach((track, index) => {
      console.log(`🎥 Track ${index}:`, {
        identity: track.participant.identity,
        isLocal: track.participant.isLocal,
        trackSid: track.publication?.trackSid,
        kind: track.publication?.kind,
        source: track.publication?.source,
        isEnabled: track.publication?.isEnabled,
        isMuted: track.publication?.isMuted,
        isSubscribed: track.publication?.isSubscribed,
      });
    });
  }, [tracks, localParticipant]);

  // Separate local and remote tracks
  const localTrack = tracks.find(t => t.participant.isLocal);
  const remoteTracks = tracks.filter(t => !t.participant.isLocal);

  // Determine user role from local participant identity
  const isDoctor = localParticipant?.identity?.includes('doctor') ?? false;
  const isPatient = localParticipant?.identity?.includes('patient') ?? false;

  // Find doctor and patient tracks
  const doctorTrack = tracks.find(t => t.participant.identity?.includes('doctor'));
  const patientTrack = tracks.find(t => t.participant.identity?.includes('patient'));

  // Role-based video display logic
  let primaryTrack: TrackReference | undefined;
  let secondaryTrack: TrackReference | undefined;

  if (isDoctor) {
    // Doctor sees patient's video as primary (full screen)
    primaryTrack = patientTrack as TrackReference;
    // Doctor sees their own video as secondary (PiP)
    secondaryTrack = doctorTrack as TrackReference;

    // If no patient connected yet, show doctor's video as primary for testing
    if (!primaryTrack && doctorTrack) {
      primaryTrack = doctorTrack as TrackReference;
      secondaryTrack = undefined; // Don't show PiP if showing own video as primary
    }
  } else if (isPatient) {
    // Patient sees doctor's image/video as primary (full screen)
    primaryTrack = doctorTrack as TrackReference;
    // Patient sees their own video as secondary (PiP)
    secondaryTrack = patientTrack as TrackReference;

    // If no doctor connected yet, show patient's video as primary for testing
    if (!primaryTrack && patientTrack) {
      primaryTrack = patientTrack as TrackReference;
      secondaryTrack = undefined; // Don't show PiP if showing own video as primary
    }
  } else {
    // Fallback to original logic if roles are not clear
    primaryTrack = remoteTracks[0] as TrackReference;
    secondaryTrack = localTrack as TrackReference;

    // If no remote tracks, show local as primary
    if (!primaryTrack && localTrack) {
      primaryTrack = localTrack as TrackReference;
      secondaryTrack = undefined;
    }
  }

  return (
    <div className="relative w-full h-full bg-gray-900">
      {/* Primary participant (full screen) */}
      {primaryTrack ? (
        <div className="absolute inset-0">
          <ParticipantTile
            key={primaryTrack.publication?.trackSid ?? primaryTrack.participant.sid}
            trackRef={primaryTrack}
            className="w-full h-full object-cover"
            disableSpeakingIndicator
          />
        </div>
      ) : (
        /* Primary participant placeholder */
        <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
          <div className="text-center text-white">
            <div className="text-4xl mb-2">
              {isDoctor ? '🩺' : '👤'}
            </div>
            <p className="text-sm mb-2">
              {isDoctor ? 'Ожидаем пациента...' : 'Ожидаем врача...'}
            </p>
            <p className="text-xs text-gray-400">
              {tracks.length > 0 ?
                `Камера работает (${tracks.length} дорожек)` :
                'Нет активных дорожек'}
            </p>
          </div>
        </div>
      )}

      {/* Secondary participant (Picture-in-Picture) */}
      {secondaryTrack && (
        <div className="absolute bottom-20 right-4 w-48 h-36
                        bg-gray-800 rounded-xl overflow-hidden
                        border-2 border-white/30 shadow-2xl backdrop-blur-sm
                        transition-all duration-300 hover:scale-105 hover:border-white/50">
          <ParticipantTile
            key={secondaryTrack.publication?.trackSid ?? secondaryTrack.participant.sid}
            trackRef={secondaryTrack}
            className="w-full h-full object-cover"
            disableSpeakingIndicator
          />

          {/* Role indicator */}
          <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm
                          rounded-full px-2 py-1 text-xs text-white font-medium">
            {secondaryTrack.participant.identity?.includes('doctor') ? '👨‍⚕️' :
             secondaryTrack.participant.identity?.includes('patient') ? '👤' : '🎥'}
          </div>
        </div>
      )}

      {/* Show all tracks fallback if role-based logic fails */}
      {!primaryTrack && !secondaryTrack && tracks.length > 0 && (
        <div className="absolute inset-0 grid grid-cols-1 gap-2 p-4">
          {tracks.map((track, index) => (
            <div key={track.publication?.trackSid ?? `${track.participant.sid}-${index}`}
                 className="bg-gray-800 rounded-lg overflow-hidden">
              <ParticipantTile
                trackRef={track}
                className="w-full h-full object-cover"
                disableSpeakingIndicator
              />
              <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                {track.participant.identity} ({track.participant.isLocal ? 'Local' : 'Remote'})
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No participants placeholder */}
      {tracks.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center
                        bg-gradient-to-br from-gray-800/50 to-gray-900/50
                        rounded-2xl backdrop-blur-sm">
          <div className="text-center text-white/70 p-8">
            <div className="text-6xl mb-4">🎥</div>
            <h3 className="text-xl font-semibold mb-2">Подключение к видеоконференции...</h3>
            <p className="text-sm">Ожидаем подключения участников</p>
            {isDoctor && <p className="text-xs mt-2">Вы вошли как врач - будете видеть пациента</p>}
            {isPatient && <p className="text-xs mt-2">Вы вошли как пациент - будете видеть врача</p>}
          </div>
        </div>
      )}

      {/* Debug info (always show for now) */}
      <div className="absolute top-4 left-4 bg-black/80 text-white text-xs p-2 rounded z-50 max-w-xs">
        <div>Role: {isDoctor ? 'Doctor' : isPatient ? 'Patient' : 'Unknown'}</div>
        <div>Local: {localParticipant?.identity || 'None'}</div>
        <div>Total Tracks: {tracks.length}</div>
        <div>Local Track: {localTrack ? 'Yes' : 'No'}</div>
        <div>Remote Tracks: {remoteTracks.length}</div>
        <div>Primary: {primaryTrack?.participant.identity || 'None'}</div>
        <div>Secondary: {secondaryTrack?.participant.identity || 'None'}</div>
      </div>
    </div>
  );
};

export default PiPLayout;
