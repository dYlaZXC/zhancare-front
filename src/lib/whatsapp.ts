const WHATSAPP_PHONE = process.env.NEXT_PUBLIC_WHATSAPP_PHONE ?? "";

export function buildWhatsAppLink(message: string, phone = WHATSAPP_PHONE): string {
  const cleaned = phone.replace(/\D/g, "");
  return `https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`;
}

export function consultationWhatsAppMessage(params: {
  id: number;
  doctorName?: string;
  scheduledAt?: string;
  meetingId?: string;
  lang?: string;
}): string {
  const { id, doctorName, scheduledAt, meetingId, lang = "ru" } = params;

  const dateStr = scheduledAt
    ? new Date(scheduledAt.endsWith("Z") ? scheduledAt.slice(0, -1) : scheduledAt).toLocaleString(
        lang === "kz" ? "kk-KZ" : lang === "en" ? "en-US" : "ru-RU",
        { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }
      )
    : "";

  if (lang === "en") {
    let msg = `Hello! I'd like to get information about my consultation:\n📋 Consultation #${id}\n`;
    if (doctorName) msg += `👨‍⚕️ Doctor: ${doctorName}\n`;
    if (dateStr) msg += `📅 Date: ${dateStr}\n`;
    if (meetingId) msg += `🔗 Meeting ID: ${meetingId}\n`;
    return msg;
  }

  if (lang === "kz") {
    let msg = `Сәлем! Кеңес туралы ақпарат алғым келеді:\n📋 Кеңес №${id}\n`;
    if (doctorName) msg += `👨‍⚕️ Дәрігер: ${doctorName}\n`;
    if (dateStr) msg += `📅 Күні: ${dateStr}\n`;
    if (meetingId) msg += `🔗 Meeting ID: ${meetingId}\n`;
    return msg;
  }

  let msg = `Здравствуйте! Хочу узнать информацию по моей консультации:\n📋 Консультация №${id}\n`;
  if (doctorName) msg += `👨‍⚕️ Врач: ${doctorName}\n`;
  if (dateStr) msg += `📅 Дата: ${dateStr}\n`;
  if (meetingId) msg += `🔗 Meeting ID: ${meetingId}\n`;
  return msg;
}
