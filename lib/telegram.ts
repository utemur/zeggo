/*
 * Telegram Bot Setup Guide
 * ─────────────────────────────────────────────────────────────
 * 1. Create a bot:
 *    - Open Telegram and search for @BotFather
 *    - Send /newbot and follow the prompts
 *    - Copy the token it gives you → TELEGRAM_BOT_TOKEN in .env.local
 *
 * 2. Get your chat_id (business owner):
 *    - Message @userinfobot on Telegram
 *    - It replies with your numeric user ID — that's your chat_id
 *    - Store it in businesses.telegram_chat_id via the Settings page
 *
 * 3. The bot must have sent at least one message to the owner first,
 *    or the owner must have messaged the bot, before it can DM them.
 * ─────────────────────────────────────────────────────────────
 */

const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`

export async function sendTelegramMessage(chatId: string, text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token || token === 'placeholder') {
    console.warn('[Telegram] TELEGRAM_BOT_TOKEN not configured — skipping notification')
    return
  }

  const res = await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    console.error('[Telegram] Failed to send message:', err)
  }
}
