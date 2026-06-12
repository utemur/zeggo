type BookingForReminder = {
  id: string
  client_name: string
  client_phone: string
  booking_datetime: string
}

export function scheduleReminder(booking: BookingForReminder): void {
  // TODO: hook this to a cron job or queue (e.g. Vercel Cron, pg_cron, BullMQ)
  console.log(
    `[Reminder] Scheduled for ${booking.booking_datetime} — ` +
    `${booking.client_name} (${booking.client_phone}) · booking ${booking.id}`
  )
}
