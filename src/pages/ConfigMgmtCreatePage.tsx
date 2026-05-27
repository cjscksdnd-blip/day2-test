import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import styles from './ConfigMgmtFormPage.module.css';

export default function ConfigMgmtCreatePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    title: '',
    description: '',
    status: 'planning' as 'planning' | 'in_progress' | 'completed' | 'on_hold',
    priority: 'medium' as 'high' | 'medium' | 'low',
    progress: 0,
    start_date: '',
    end_date: '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: name === 'progress' ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { setError('제목을 입력해주세요.'); return; }
    if (!user) return;

    setLoading(true);
    setError('');

    const { error: supaErr } = await supabase.from('config_items').insert({
      title: form.title.trim(),
      description: form.description.trim() || null,
      status: form.status,
      priority: form.priority,
      progress: form.progress,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      author_id: user.id,
    });

    if (supaErr) {
      setError('등록에 실패했습니다: ' + supaErr.message);
      setLoading(false);
      return;
    }

    navigate('/config-mgmt');
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h1 className={styles.heading}>형상관리 항목 등록</h1>
          <p className={styles.sub}>새로운 형상관리 항목을 등록합니다</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>
              제목 <span className={styles.required}>*</span>
            </label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="형상관리 항목 제목을 입력하세요"
              className={styles.input}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>설명</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="항목에 대한 상세 설명을 입력하세요"
              className={styles.textarea}
              rows={4}
            />
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>상태</label>
              <select name="status" value={form.status} onChange={handleChange} className={styles.select}>
                <option value="planning">계획중</option>
                <option value="in_progress">진행중</option>
                <option value="completed">완료</option>
                <option value="on_hold">보류</option>
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>우선순위</label>
              <select name="priority" value={form.priority} onChange={handleChange} className={styles.select}>
                <option value="high">높음</option>
                <option value="medium">보통</option>
                <option value="low">낮음</option>
              </select>
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>
              진행률&nbsp;<strong className={styles.progressValue}>{form.progress}%</strong>
            </label>
            <input
              type="range"
              name="progress"
              min={0}
              max={100}
              step={5}
              value={form.progress}
              onChange={handleChange}
              className={styles.range}
            />
            <div className={styles.rangeLabels}>
              <span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
            </div>
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{ width: `${form.progress}%` }} />
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>시작일</label>
              <input
                type="date"
                name="start_date"
                value={form.start_date}
                onChange={handleChange}
                className={styles.input}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>종료일 (마감일)</label>
              <input
                type="date"
                name="end_date"
                value={form.end_date}
                onChange={handleChange}
                className={styles.input}
              />
            </div>
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.buttonRow}>
            <button
              type="button"
              onClick={() => navigate('/config-mgmt')}
              className={styles.btnCancel}
            >
              취소
            </button>
            <button type="submit" disabled={loading} className={styles.btnSubmit}>
              {loading ? '등록 중...' : '등록하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
