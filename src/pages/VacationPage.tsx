import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import styles from './VacationPage.module.css';

interface Vacation {
  id: string;
  employee_name: string;
  start_date: string;
  end_date: string;
  vacation_type: string;
  reason?: string;
  created_at: string;
}

interface WeekEvent {
  vacation: Vacation;
  colStart: number;
  colEnd: number;
  lane: number;
}

const COLORS = ['#4A90D9', '#E67E22', '#27AE60', '#9B59B6', '#E74C3C', '#1ABC9C', '#F39C12', '#34495E'];
const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

function hashColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}

function toLocalDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function parseLocalDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function getCalendarWeeks(year: number, month: number): Date[][] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const start = new Date(firstDay);
  start.setDate(firstDay.getDate() - firstDay.getDay());

  const weeks: Date[][] = [];
  const cur = new Date(start);

  while (cur <= lastDay) {
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(new Date(cur));
      cur.setDate(cur.getDate() + 1);
    }
    weeks.push(week);
  }

  return weeks;
}

function dayDiff(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

function getWeekEvents(weekDays: Date[], vacations: Vacation[]): WeekEvent[] {
  const weekStart = weekDays[0];
  const weekEnd = weekDays[6];

  const overlapping = vacations
    .filter(v => {
      const s = parseLocalDate(v.start_date);
      const e = parseLocalDate(v.end_date);
      return s <= weekEnd && e >= weekStart;
    })
    .sort((a, b) =>
      a.start_date.localeCompare(b.start_date) || a.employee_name.localeCompare(b.employee_name)
    );

  const laneEndCols: number[] = [];

  return overlapping.map(v => {
    const s = parseLocalDate(v.start_date);
    const e = parseLocalDate(v.end_date);

    const colStart = Math.max(0, Math.min(6, dayDiff(weekStart, s)));
    const colEnd = Math.max(0, Math.min(6, dayDiff(weekStart, e)));

    let lane = 0;
    while (lane < laneEndCols.length && laneEndCols[lane] >= colStart) {
      lane++;
    }
    laneEndCols[lane] = colEnd;

    return { vacation: v, colStart, colEnd, lane };
  });
}

const todayStr = toLocalDateStr(new Date());

export default function VacationPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [vacations, setVacations] = useState<Vacation[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchVacations = useCallback(async () => {
    setLoading(true);

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const calStart = new Date(firstDay);
    calStart.setDate(firstDay.getDate() - firstDay.getDay());
    const calEnd = new Date(lastDay);
    calEnd.setDate(lastDay.getDate() + (6 - lastDay.getDay()));

    const { data } = await supabase
      .from('vacations')
      .select('*')
      .lte('start_date', toLocalDateStr(calEnd))
      .gte('end_date', toLocalDateStr(calStart))
      .order('start_date', { ascending: true });

    setVacations(data || []);
    setLoading(false);
  }, [year, month]);

  useEffect(() => {
    fetchVacations();
  }, [fetchVacations]);

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  }

  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  }

  async function handleDelete(v: Vacation) {
    const confirmed = window.confirm(
      `[${v.vacation_type}] ${v.employee_name}\n${v.start_date} ~ ${v.end_date}${v.reason ? `\n사유: ${v.reason}` : ''}\n\n삭제하시겠습니까?`
    );
    if (!confirmed) return;
    await supabase.from('vacations').delete().eq('id', v.id);
    fetchVacations();
  }

  const weeks = getCalendarWeeks(year, month);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.monthNav}>
          <button onClick={prevMonth} className={styles.navBtn}>&#8249;</button>
          <span className={styles.monthTitle}>{year}년 {month + 1}월</span>
          <button onClick={nextMonth} className={styles.navBtn}>&#8250;</button>
        </div>
        <Link to="/vacation/new" className={styles.addBtn}>+ 휴가 등록</Link>
      </div>

      {loading ? (
        <p className={styles.loading}>불러오는 중...</p>
      ) : (
        <div className={styles.calendar}>
          <div className={styles.dayHeaders}>
            {DAY_NAMES.map((d, i) => (
              <div
                key={d}
                className={`${styles.dayName} ${i === 0 ? styles.sundayLabel : i === 6 ? styles.saturdayLabel : ''}`}
              >
                {d}
              </div>
            ))}
          </div>

          {weeks.map((week, wi) => {
            const events = getWeekEvents(week, vacations);
            const maxLane = events.length > 0 ? Math.max(...events.map(e => e.lane)) : -1;

            return (
              <div key={wi} className={styles.week}>
                <div className={styles.dayRow}>
                  {week.map((day, di) => {
                    const dateStr = toLocalDateStr(day);
                    const isCurrentMonth = day.getMonth() === month;
                    const isToday = dateStr === todayStr;
                    return (
                      <div
                        key={di}
                        className={`${styles.dayCell} ${!isCurrentMonth ? styles.otherMonth : ''} ${isToday ? styles.todayCell : ''}`}
                      >
                        <span
                          className={`${styles.dayNum} ${di === 0 ? styles.sundayNum : di === 6 ? styles.saturdayNum : ''} ${isToday ? styles.todayNum : ''}`}
                        >
                          {day.getDate()}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {Array.from({ length: maxLane + 1 }, (_, lane) => (
                  <div key={lane} className={styles.eventRow}>
                    {events
                      .filter(e => e.lane === lane)
                      .map(e => {
                        const span = e.colEnd - e.colStart + 1;
                        const color = hashColor(e.vacation.employee_name);
                        const vStart = parseLocalDate(e.vacation.start_date);
                        const isStart = vStart >= week[e.colStart];
                        const vEnd = parseLocalDate(e.vacation.end_date);
                        const isEnd = vEnd <= week[e.colEnd];
                        const borderRadius = `${isStart ? '4px' : '0'} ${isEnd ? '4px' : '0'} ${isEnd ? '4px' : '0'} ${isStart ? '4px' : '0'}`;
                        return (
                          <div
                            key={e.vacation.id}
                            className={styles.eventBar}
                            style={{
                              gridColumn: `${e.colStart + 1} / span ${span}`,
                              backgroundColor: color,
                              borderRadius,
                            }}
                            onClick={() => handleDelete(e.vacation)}
                            title={`${e.vacation.employee_name} (${e.vacation.vacation_type})\n${e.vacation.start_date} ~ ${e.vacation.end_date}${e.vacation.reason ? '\n' + e.vacation.reason : ''}`}
                          >
                            {isStart && e.vacation.employee_name}
                          </div>
                        );
                      })}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
