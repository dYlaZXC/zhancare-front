import { useEffect, useRef } from "react";
import { websocketService } from "@/services/websocketService";

interface SlotBookedEvent {
  scheduled_time: string; // "YYYY-MM-DDTHH:MM:SS" local time
  doctor_id: number;
}

interface UseSlotWebSocketOptions {
  doctorId: number | null;
  date: string; // "YYYY-MM-DD"
  enabled: boolean;
  onSlotBooked: (event: SlotBookedEvent) => void;
}

export function useSlotWebSocket({
  doctorId,
  date,
  enabled,
  onSlotBooked,
}: UseSlotWebSocketOptions) {
  const currentRoomRef = useRef<string | null>(null);
  const onSlotBookedRef = useRef(onSlotBooked);
  onSlotBookedRef.current = onSlotBooked;

  useEffect(() => {
    if (!enabled || !doctorId || !date) return;

    const roomName = `slots_doctor_${doctorId}_${date}`;

    const handleMessage = (data: {
      room: string;
      message: { event: string; scheduled_time: string; doctor_id: number };
      sender: string;
    }) => {
      if (data.room !== roomName) return;
      if (data.message?.event !== "slot_booked") return;
      onSlotBookedRef.current({
        scheduled_time: data.message.scheduled_time,
        doctor_id: data.message.doctor_id,
      });
    };

    // Leave previous room if doctor/date changed
    if (currentRoomRef.current && currentRoomRef.current !== roomName) {
      websocketService.leaveRoom(currentRoomRef.current);
    }

    websocketService.joinRoom(roomName);
    currentRoomRef.current = roomName;
    websocketService.on("message", handleMessage);

    return () => {
      websocketService.off("message", handleMessage);
      websocketService.leaveRoom(roomName);
      currentRoomRef.current = null;
    };
  }, [doctorId, date, enabled]);
}
