// ─── Greeting Message System ─────────────────────────────────────────────────

type TimeBlock = 'early_morning' | 'morning' | 'afternoon' | 'evening' | 'night';
type Context =
  | 'first_visit_today'
  | 'returning_quickly'
  | 'returning_after_break'
  | 'returning_after_long_break'
  | 'streak'
  | 'default';

const LS_LAST_SESSION = 'cx_last_session';       // timestamp ms
const LS_LAST_GREETING = 'cx_last_greeting_id';  // string id
const LS_STREAK_COUNT = 'cx_streak_count';        // integer
const LS_STREAK_DATE = 'cx_streak_last_date';     // YYYY-MM-DD
const LS_USER_NAME = 'cx_user_name';              // first name

// ─── Message templates ────────────────────────────────────────────────────────

type MsgKey = `${Context}__${TimeBlock | 'any'}`;

const MESSAGES: Partial<Record<MsgKey, { id: string; text: (name: string, n?: number) => string }[]>> = {
  'first_visit_today__early_morning': [
    { id: 'fvt_em_0', text: (n) => `Good morning, ${n}.` },
    { id: 'fvt_em_1', text: (n) => `Early start today, ${n}.` },
    { id: 'fvt_em_2', text: (n) => `Morning, ${n}. What's on the agenda?` },
  ],
  'first_visit_today__morning': [
    { id: 'fvt_mo_0', text: (n) => `Good morning, ${n}.` },
    { id: 'fvt_mo_1', text: (n) => `Morning, ${n}. Ready when you are.` },
    { id: 'fvt_mo_2', text: (n) => `Hey ${n}, good morning.` },
  ],
  'first_visit_today__afternoon': [
    { id: 'fvt_af_0', text: (n) => `Good afternoon, ${n}.` },
    { id: 'fvt_af_1', text: (n) => `Afternoon, ${n}. What are we working on?` },
    { id: 'fvt_af_2', text: (n) => `Hey ${n}, good to see you.` },
  ],
  'first_visit_today__evening': [
    { id: 'fvt_ev_0', text: (n) => `Good evening, ${n}.` },
    { id: 'fvt_ev_1', text: (n) => `Evening, ${n}. What can I help with?` },
    { id: 'fvt_ev_2', text: (n) => `Hey ${n}, winding down or just getting started?` },
  ],
  'first_visit_today__night': [
    { id: 'fvt_ni_0', text: (n) => `Burning the midnight oil, ${n}?` },
    { id: 'fvt_ni_1', text: (n) => `Late one tonight, ${n}.` },
    { id: 'fvt_ni_2', text: (n) => `Hey ${n}, night owl mode.` },
  ],
  'returning_quickly__any': [
    { id: 'rq_0', text: (n) => `Back already, ${n}.` },
    { id: 'rq_1', text: (n) => `Welcome back, ${n}.` },
    { id: 'rq_2', text: (n) => `Where were we, ${n}?` },
  ],
  'returning_after_break__any': [
    { id: 'rab_0', text: (n) => `Back at it, ${n}.` },
    { id: 'rab_1', text: (n) => `Welcome back, ${n}. Pick up where you left off?` },
    { id: 'rab_2', text: (n) => `Hey ${n}, ready for round two?` },
  ],
  'returning_after_long_break__any': [
    { id: 'ralb_0', text: (n) => `Been a while, ${n}. Good to see you.` },
    { id: 'ralb_1', text: (n) => `Welcome back, ${n}.` },
    { id: 'ralb_2', text: (n) => `Hey ${n}, welcome back.` },
  ],
  'streak__any': [
    { id: 'str_0', text: (n, d) => `${d} days in a row, ${n}. Solid streak.` },
    { id: 'str_1', text: (n, d) => `Day ${d}, ${n}. Consistency wins.` },
    { id: 'str_2', text: (n, d) => `Back again, ${n}. ${d}-day streak.` },
  ],
  'default__any': [
    { id: 'def_0', text: (n) => `Hey ${n}.` },
    { id: 'def_1', text: (n) => `Welcome back, ${n}.` },
    { id: 'def_2', text: (n) => `Good to see you, ${n}.` },
  ],
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getTimeBlock(date: Date): TimeBlock {
  const h = date.getHours();
  if (h >= 5 && h < 9) return 'early_morning';
  if (h >= 9 && h < 12) return 'morning';
  if (h >= 12 && h < 17) return 'afternoon';
  if (h >= 17 && h < 21) return 'evening';
  return 'night';
}

function todayStr(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function yesterdayStr(date: Date): string {
  const d = new Date(date);
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

function determineContext(now: Date): { context: Context; streakCount: number } {
  const lastSession = parseInt(localStorage.getItem(LS_LAST_SESSION) ?? '0', 10);
  const streakCount = parseInt(localStorage.getItem(LS_STREAK_COUNT) ?? '1', 10);
  const streakLastDate = localStorage.getItem(LS_STREAK_DATE) ?? '';
  const today = todayStr(now);
  const yesterday = yesterdayStr(now);

  // No previous session = first ever visit
  if (!lastSession) return { context: 'first_visit_today', streakCount: 1 };

  const lastDate = todayStr(new Date(lastSession));
  const elapsedMs = now.getTime() - lastSession;
  const elapsedMin = elapsedMs / 60000;

  // Same calendar day?
  if (lastDate === today) {
    if (elapsedMin < 30) return { context: 'returning_quickly', streakCount };
    if (elapsedMin < 240) return { context: 'returning_after_break', streakCount };
    return { context: 'returning_after_long_break', streakCount };
  }

  // Different day = first visit today, update streak
  const newStreak = streakLastDate === yesterday ? streakCount + 1 : 1;
  if (newStreak >= 3) return { context: 'streak', streakCount: newStreak };
  return { context: 'first_visit_today', streakCount: newStreak };
}

function pickMessage(
  context: Context,
  timeBlock: TimeBlock,
  name: string,
  streakCount: number,
  lastGreetingId: string,
): { id: string; text: string } {
  // Build candidate keys in priority order
  const keys: MsgKey[] = [
    `${context}__${timeBlock}`,
    `${context}__any`,
    'default__any',
  ];

  for (const key of keys) {
    const pool = MESSAGES[key];
    if (!pool) continue;
    // Streak context: 30% chance of using it (blend with time-of-day if relevant)
    if (context === 'streak' && key === 'streak__any') {
      if (Math.random() > 0.30 && pool.length > 1) continue;
    }
    const available = pool.filter((m) => m.id !== lastGreetingId);
    const source = available.length > 0 ? available : pool;
    const entry = source[Math.floor(Math.random() * source.length)];
    return { id: entry.id, text: entry.text(name, streakCount) };
  }

  // Ultimate fallback
  return { id: 'fallback', text: `Welcome back, ${name}.` };
}

// ─── Public API ───────────────────────────────────────────────────────────────

export interface GreetingResult {
  text: string;
  id: string;
}

export function resolveGreeting(): GreetingResult {
  const now = new Date();
  const name = localStorage.getItem(LS_USER_NAME) || 'Claudiu';
  const lastGreetingId = localStorage.getItem(LS_LAST_GREETING) ?? '';
  const timeBlock = getTimeBlock(now);
  const { context, streakCount } = determineContext(now);

  const { id, text } = pickMessage(context, timeBlock, name, streakCount, lastGreetingId);

  // Persist updated state
  const today = todayStr(now);
  localStorage.setItem(LS_LAST_SESSION, String(now.getTime()));
  localStorage.setItem(LS_LAST_GREETING, id);
  localStorage.setItem(LS_STREAK_COUNT, String(streakCount));
  localStorage.setItem(LS_STREAK_DATE, today);

  return { text, id };
}

/** Call this on every page focus/activity to keep lastSession fresh */
export function touchSession(): void {
  localStorage.setItem(LS_LAST_SESSION, String(Date.now()));
}

/** Set the user's first name shown in greetings */
export function setGreetingName(name: string): void {
  localStorage.setItem(LS_USER_NAME, name);
}
