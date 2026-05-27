import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import styles from './VacationFormPage.module.css';

const VACATION_TYPES = ['연차', '반차', '특별휴가', '병가', '기타'];

export default function VacationCreatePage() {
  const navigate = useNavigate();
  const [employeeName, setEmployeeName] = useState('');
  const [vacationType, setVacationType] = useState('연차');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!employeeName.trim()) { setError('직원 이름을 입력해주세요.'); return; }
    if (!startDate) { setError('시작일을 선택해주세요.'); return; }
    if (!endDate) { setError('종료일을 선택해주세요.'); return; }
    if (endDate < startDate) { setError('종료일은 시작일 이후여야 합니다.'); return; }

    setError('');
    setLoading(true);

    const { error: err } = await supabase.from('vacations').insert({
      employee_name: employeeName.trim(),
      vacation_type: vacationType,
      start_date: startDate,
      end_date: endDate,
      reason: reason.trim() || null,
    });

    if (err) {
      setError('등록에 실패했습니다. 잠시 후 다시 시도해주세요.');
      setLoading(false);
      return;
    }

    navigate('/vacation');
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h2 className={styles.title}>휴가 등록</h2>
        <form onSubmit={handleSubmit} className={styles.form}>

          <div className={styles.formGroup}>
            <label className={styles.label}>직원 이름 *</label>
            <input
              type="text"
              value={employeeName}
              onChange={e => setEmployeeName(e.target.value)}
              placeholder="이름을 입력하세요"
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>휴가 유형</label>
            <select
              value={vacationType}
              onChange={e => setVacationType(e.target.value)}
              className={styles.input}
            >
              {VACATION_TYPES.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label}>시작일 *</label>
              <input
                type="date"
                value={startDate}
                onChange={e => {
                  setStartDate(e.target.value);
                  if (endDate && e.target.value > endDate) setEndDate(e.target.value);
                }}
                className={styles.input}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>종료일 *</label>
              <input
                type="date"
                value={endDate}
                min={startDate}
                onChange={e => setEndDate(e.target.value)}
                className={styles.input}
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>비고 (선택)</label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="사유나 메모를 입력하세요"
              rows={3}
              className={styles.textarea}
            />
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.actions}>
            <button
              type="button"
              onClick={() => navigate('/vacation')}
              className={styles.cancelBtn}
            >
              취소
            </button>
            <button type="submit" disabled={loading} className={styles.submitBtn}>
              {loading ? '등록 중...' : '등록'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
