import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { ConfigItem } from '../types';
import styles from './ConfigMgmtPage.module.css';

type FilterType = 'all' | 'in_progress' | 'planning' | 'completed' | 'on_hold' | 'delayed';

const STATUS_LABEL: Record<ConfigItem['status'], string> = {
  planning: '계획중',
  in_progress: '진행중',
  completed: '완료',
  on_hold: '보류',
};

const PRIORITY_LABEL: Record<ConfigItem['priority'], string> = {
  high: '높음',
  medium: '보통',
  low: '낮음',
};

function getRemainingDays(endDate: string | null): number | null {
  if (!endDate) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function isDelayed(item: ConfigItem): boolean {
  if (item.status === 'completed') return false;
  const days = getRemainingDays(item.end_date);
  return days !== null && days < 0;
}

function formatDate(d: string | null) {
  if (!d) return '미설정';
  return new Date(d).toLocaleDateString('ko-KR', { year: '2-digit', month: 'short', day: 'numeric' });
}

export default function ConfigMgmtPage() {
  const [items, setItems] = useState<ConfigItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('config_items')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error) setItems(data ?? []);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('이 항목을 삭제하시겠습니까?')) return;
    const { error } = await supabase.from('config_items').delete().eq('id', id);
    if (!error) setItems(prev => prev.filter(i => i.id !== id));
  };

  const stats = {
    total: items.length,
    inProgress: items.filter(i => i.status === 'in_progress').length,
    completed: items.filter(i => i.status === 'completed').length,
    delayed: items.filter(isDelayed).length,
    planning: items.filter(i => i.status === 'planning').length,
  };

  const filtered =
    filter === 'all' ? items :
    filter === 'delayed' ? items.filter(isDelayed) :
    items.filter(i => i.status === filter);

  return (
    <div className={styles.page}>
      {/* 헤더 */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.heading}>형상관리</h1>
          <p className={styles.subHeading}>프로젝트 형상 항목의 진행 현황을 관리합니다</p>
        </div>
        {user && (
          <Link to="/config-mgmt/new" className={styles.btnNew}>+ 새 항목 등록</Link>
        )}
      </div>

      {/* 통계 카드 */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard} onClick={() => setFilter('all')}>
          <span className={styles.statNumber}>{stats.total}</span>
          <span className={styles.statLabel}>전체 항목</span>
        </div>
        <div className={`${styles.statCard} ${styles.statBlue}`} onClick={() => setFilter('in_progress')}>
          <span className={styles.statNumber}>{stats.inProgress}</span>
          <span className={styles.statLabel}>진행중</span>
        </div>
        <div className={`${styles.statCard} ${styles.statGreen}`} onClick={() => setFilter('completed')}>
          <span className={styles.statNumber}>{stats.completed}</span>
          <span className={styles.statLabel}>완료</span>
        </div>
        <div className={`${styles.statCard} ${styles.statRed}`} onClick={() => setFilter('delayed')}>
          <span className={styles.statNumber}>{stats.delayed}</span>
          <span className={styles.statLabel}>지연</span>
        </div>
      </div>

      {/* 필터 탭 */}
      <div className={styles.tabs}>
        {([
          ['all', '전체', stats.total],
          ['in_progress', '진행중', stats.inProgress],
          ['planning', '계획중', stats.planning],
          ['completed', '완료', stats.completed],
          ['on_hold', '보류', null],
          ['delayed', '지연', stats.delayed],
        ] as [FilterType, string, number | null][]).map(([val, label, count]) => (
          <button
            key={val}
            className={`${styles.tab} ${filter === val ? styles.tabActive : ''}`}
            onClick={() => setFilter(val)}
          >
            {label}
            {count !== null && <span className={styles.tabCount}>{count}</span>}
          </button>
        ))}
      </div>

      {/* 리스트 */}
      {loading ? (
        <div className={styles.empty}><p>불러오는 중...</p></div>
      ) : filtered.length === 0 ? (
        <div className={styles.empty}>
          <p>등록된 형상관리 항목이 없습니다.</p>
          {user && <Link to="/config-mgmt/new" className={styles.btnNewInline}>+ 첫 항목 등록하기</Link>}
        </div>
      ) : (
        <div className={styles.listWrap}>
          {/* 테이블 헤더 */}
          <div className={styles.listHeader}>
            <span className={styles.colBadges}>우선순위 / 상태</span>
            <span className={styles.colTitle}>제목 및 설명</span>
            <span className={styles.colProgress}>진행률</span>
            <span className={styles.colDate}>기간 / D-day</span>
            <span className={styles.colActions}>관리</span>
          </div>

          {/* 리스트 아이템 */}
          {filtered.map((item, idx) => {
            const remaining = getRemainingDays(item.end_date);
            const delayed = isDelayed(item);

            return (
              <div
                key={item.id}
                className={`${styles.listRow} ${delayed ? styles.rowDelayed : ''} ${idx % 2 === 1 ? styles.rowAlt : ''}`}
              >
                {/* 우선순위 + 상태 */}
                <div className={styles.colBadges}>
                  <span className={`${styles.priorityBadge} ${styles[`priority_${item.priority}` as keyof typeof styles]}`}>
                    {PRIORITY_LABEL[item.priority]}
                  </span>
                  <span className={`${styles.statusBadge} ${styles[`status_${item.status}` as keyof typeof styles]}`}>
                    {STATUS_LABEL[item.status]}
                  </span>
                </div>

                {/* 제목 + 설명 */}
                <div className={styles.colTitle}>
                  <span className={styles.rowTitle}>{item.title}</span>
                  {item.description && (
                    <span className={styles.rowDesc}>
                      {item.description.length > 60
                        ? item.description.slice(0, 60) + '...'
                        : item.description}
                    </span>
                  )}
                </div>

                {/* 진행률 */}
                <div className={styles.colProgress}>
                  <div className={styles.progressTop}>
                    <span className={styles.progressBar}>
                      <span
                        className={styles.progressFill}
                        style={{ width: `${item.progress}%` }}
                      />
                    </span>
                    <span className={styles.progressPct}>{item.progress}%</span>
                  </div>
                </div>

                {/* 기간 + D-day */}
                <div className={styles.colDate}>
                  <span className={styles.dateText}>
                    {formatDate(item.start_date)} ~ {formatDate(item.end_date)}
                  </span>
                  {remaining !== null && (
                    <span className={`${styles.dday} ${
                      delayed ? styles.ddayOverdue :
                      remaining <= 7 ? styles.ddayUrgent :
                      styles.ddayNormal
                    }`}>
                      {delayed ? `D+${Math.abs(remaining)} 지연` : remaining === 0 ? 'D-Day' : `D-${remaining}`}
                    </span>
                  )}
                </div>

                {/* 수정/삭제 */}
                <div className={styles.colActions}>
                  {user?.id === item.author_id ? (
                    <>
                      <button onClick={() => navigate(`/config-mgmt/${item.id}/edit`)} className={styles.btnEdit}>수정</button>
                      <button onClick={() => handleDelete(item.id)} className={styles.btnDelete}>삭제</button>
                    </>
                  ) : (
                    <span className={styles.noAction}>—</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
