import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { ConfigItem } from '../types';
import styles from './ConfigMgmtDetailPage.module.css';

const STATUS_LABEL: Record<ConfigItem['status'], string> = {
  planning: '계획중', in_progress: '진행중', completed: '완료', on_hold: '보류',
};
const PRIORITY_LABEL: Record<ConfigItem['priority'], string> = {
  high: '높음', medium: '보통', low: '낮음',
};

function getRemainingDays(endDate: string | null) {
  if (!endDate) return null;
  const now = new Date(); now.setHours(0, 0, 0, 0);
  return Math.ceil((new Date(endDate).getTime() - now.getTime()) / 86400000);
}

function relativeTime(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return '방금 전';
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}일 전`;
  return new Date(dateStr).toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' });
}

function isModified(item: ConfigItem) {
  if (!item.updated_at) return false;
  return new Date(item.updated_at).getTime() - new Date(item.created_at).getTime() > 5000;
}

export default function ConfigMgmtDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [item, setItem] = useState<ConfigItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  // 인라인 수정 상태
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [form, setForm] = useState({
    title: '', description: '', assignee: '',
    status: 'planning' as ConfigItem['status'],
    priority: 'medium' as ConfigItem['priority'],
    progress: 0, start_date: '', end_date: '',
  });

  useEffect(() => {
    if (!id) return;
    supabase.from('config_items').select('*').eq('id', id).single()
      .then(({ data }) => {
        if (data) {
          setItem(data);
          setForm({
            title: data.title,
            description: data.description ?? '',
            assignee: data.assignee ?? '',
            status: data.status,
            priority: data.priority,
            progress: data.progress,
            start_date: data.start_date ?? '',
            end_date: data.end_date ?? '',
          });
        }
        setLoading(false);
      });
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: name === 'progress' ? Number(value) : value }));
  };

  const handleSave = async () => {
    if (!form.title.trim()) { setSaveError('제목을 입력해주세요.'); return; }
    setSaving(true); setSaveError('');
    const { data, error } = await supabase
      .from('config_items')
      .update({
        title: form.title.trim(),
        description: form.description.trim() || null,
        assignee: form.assignee.trim() || null,
        status: form.status, priority: form.priority,
        progress: form.progress,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
      })
      .eq('id', id)
      .select('*')
      .single();

    if (error) { setSaveError('저장에 실패했습니다.'); setSaving(false); return; }
    setItem(data);
    setEditing(false);
    setSaving(false);
  };

  const handleCancel = () => {
    if (!item) return;
    setForm({
      title: item.title, description: item.description ?? '',
      assignee: item.assignee ?? '', status: item.status,
      priority: item.priority, progress: item.progress,
      start_date: item.start_date ?? '', end_date: item.end_date ?? '',
    });
    setEditing(false); setSaveError('');
  };

  if (loading) return <div className={styles.loading}>불러오는 중...</div>;
  if (!item) return <div className={styles.loading}>항목을 찾을 수 없습니다.</div>;

  const remaining = getRemainingDays(item.end_date);
  const delayed = item.status !== 'completed' && remaining !== null && remaining < 0;
  const modified = isModified(item);
  const isAuthor = user?.id === item.author_id;

  return (
    <div className={styles.page}>
      {/* 상단 내비 */}
      <div className={styles.topBar}>
        <button className={styles.btnBack} onClick={() => navigate('/config-mgmt')}>
          ← 목록으로
        </button>
        {isAuthor && !editing && (
          <button className={styles.btnEdit} onClick={() => setEditing(true)}>
            ✏ 수정하기
          </button>
        )}
        {editing && (
          <div className={styles.editActions}>
            <button className={styles.btnCancel} onClick={handleCancel}>취소</button>
            <button className={styles.btnSave} onClick={handleSave} disabled={saving}>
              {saving ? '저장 중...' : '저장하기'}
            </button>
          </div>
        )}
      </div>

      <div className={styles.card}>
        {/* 배지 행 */}
        <div className={styles.badgeRow}>
          {editing ? (
            <>
              <select name="priority" value={form.priority} onChange={handleChange} className={styles.selectInline}>
                <option value="high">높음</option>
                <option value="medium">보통</option>
                <option value="low">낮음</option>
              </select>
              <select name="status" value={form.status} onChange={handleChange} className={styles.selectInline}>
                <option value="planning">계획중</option>
                <option value="in_progress">진행중</option>
                <option value="completed">완료</option>
                <option value="on_hold">보류</option>
              </select>
            </>
          ) : (
            <>
              <span className={`${styles.priorityBadge} ${styles[`priority_${item.priority}`]}`}>
                {PRIORITY_LABEL[item.priority]}
              </span>
              <span className={`${styles.statusBadge} ${styles[`status_${item.status}`]}`}>
                {STATUS_LABEL[item.status]}
              </span>
              {delayed && <span className={styles.delayedBadge}>⚠ 지연</span>}
              {modified && <span className={styles.modifiedBadge}>수정됨</span>}
            </>
          )}
        </div>

        {/* 제목 */}
        <div className={styles.titleSection}>
          {editing ? (
            <input name="title" value={form.title} onChange={handleChange} className={styles.titleInput} />
          ) : (
            <h1 className={styles.title}>{item.title}</h1>
          )}
        </div>

        {/* 메타 정보 */}
        <div className={styles.metaRow}>
          <span className={styles.metaItem}>
            👤 {editing ? (
              <input name="assignee" value={form.assignee} onChange={handleChange} className={styles.metaInput} placeholder="담당자" />
            ) : (
              <strong>{item.assignee ?? '미지정'}</strong>
            )}
          </span>
          <span className={styles.metaDot}>·</span>
          <span className={styles.metaItem}>
            등록일 <strong>{new Date(item.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' })}</strong>
          </span>
          {modified && item.updated_at && (
            <>
              <span className={styles.metaDot}>·</span>
              <span className={`${styles.metaItem} ${styles.metaModified}`}>
                {relativeTime(item.updated_at)} 수정됨
              </span>
            </>
          )}
        </div>

        <div className={styles.divider} />

        {/* 진행률 */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionLabel}>진행률</span>
            <span className={styles.progressPct}>
              {editing ? form.progress : item.progress}%
            </span>
          </div>
          {editing ? (
            <div className={styles.sliderWrap}>
              <input
                type="range" name="progress" min={0} max={100} step={5}
                value={form.progress} onChange={handleChange} className={styles.range}
              />
              <div className={styles.rangeLabels}>
                <span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
              </div>
            </div>
          ) : null}
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${editing ? form.progress : item.progress}%` }}
            />
          </div>
        </div>

        {/* 기간 */}
        <div className={styles.section}>
          <span className={styles.sectionLabel}>기간</span>
          {editing ? (
            <div className={styles.dateRow}>
              <input type="date" name="start_date" value={form.start_date} onChange={handleChange} className={styles.dateInput} />
              <span className={styles.dateSep}>~</span>
              <input type="date" name="end_date" value={form.end_date} onChange={handleChange} className={styles.dateInput} />
            </div>
          ) : (
            <div className={styles.dateDisplay}>
              <span className={styles.dateText}>
                📅 {item.start_date
                  ? new Date(item.start_date).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
                  : '미설정'}
                {' → '}
                {item.end_date
                  ? new Date(item.end_date).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
                  : '미설정'}
              </span>
              {remaining !== null && (
                <span className={`${styles.dday} ${delayed ? styles.ddayOverdue : remaining <= 7 ? styles.ddayUrgent : styles.ddayNormal}`}>
                  {delayed ? `D+${Math.abs(remaining)} 지연` : remaining === 0 ? 'D-Day' : `D-${remaining}`}
                </span>
              )}
            </div>
          )}
        </div>

        {/* 설명 */}
        <div className={styles.section}>
          <span className={styles.sectionLabel}>설명</span>
          {editing ? (
            <textarea
              name="description" value={form.description} onChange={handleChange}
              className={styles.descTextarea} rows={5} placeholder="설명을 입력하세요"
            />
          ) : (
            <>
              <p className={styles.descText}>
                {item.description ?? <span className={styles.noDesc}>설명이 없습니다.</span>}
              </p>
              {item.images && item.images.length > 0 && (
                <div className={styles.imageGrid}>
                  {item.images.map((url, i) => (
                    <img
                      key={url}
                      src={url}
                      alt={`첨부 이미지 ${i + 1}`}
                      className={styles.imageThumb}
                      onClick={() => setLightboxUrl(url)}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {saveError && <p className={styles.saveError}>{saveError}</p>}

        <div className={styles.divider} />

        {/* 하단 저장 버튼 (편집 모드) */}
        {editing && (
          <div className={styles.bottomActions}>
            <button className={styles.btnCancel} onClick={handleCancel}>취소</button>
            <button className={styles.btnSave} onClick={handleSave} disabled={saving}>
              {saving ? '저장 중...' : '저장하기'}
            </button>
          </div>
        )}
      </div>

      {lightboxUrl && (
        <div className={styles.lightbox} onClick={() => setLightboxUrl(null)}>
          <button className={styles.lightboxClose} onClick={() => setLightboxUrl(null)}>×</button>
          <img src={lightboxUrl} alt="첨부 이미지" className={styles.lightboxImg} />
        </div>
      )}
    </div>
  );
}
