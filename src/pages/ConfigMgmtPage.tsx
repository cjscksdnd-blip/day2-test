import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { ConfigItem } from '../types';
import styles from './ConfigMgmtPage.module.css';

type FilterType = 'all' | 'in_progress' | 'planning' | 'completed' | 'on_hold' | 'delayed';
type ViewMode = 'list' | 'byAssignee' | 'byYear' | 'byMonth' | 'byDay';

const STATUS_LABEL: Record<ConfigItem['status'], string> = {
  planning: '계획중', in_progress: '진행중', completed: '완료', on_hold: '보류',
};
const PRIORITY_LABEL: Record<ConfigItem['priority'], string> = {
  high: '높음', medium: '보통', low: '낮음',
};

function getRemainingDays(endDate: string | null): number | null {
  if (!endDate) return null;
  const now = new Date(); now.setHours(0, 0, 0, 0);
  return Math.ceil((new Date(endDate).getTime() - now.getTime()) / 86400000);
}
function isDelayed(item: ConfigItem) {
  if (item.status === 'completed') return false;
  const d = getRemainingDays(item.end_date);
  return d !== null && d < 0;
}
function formatDate(d: string | null) {
  if (!d) return '미설정';
  return new Date(d).toLocaleDateString('ko-KR', { year: '2-digit', month: 'short', day: 'numeric' });
}

/* ── 그룹핑 함수 ── */
type GroupEntry = { sortKey: string; label: string; items: ConfigItem[] };

function makeGroups(
  items: ConfigItem[],
  keyFn: (item: ConfigItem) => { sortKey: string; label: string },
  unsetLabel = '미설정'
): [string, ConfigItem[]][] {
  const map = new Map<string, GroupEntry>();
  for (const item of items) {
    const { sortKey, label } = item.end_date ? keyFn(item) : { sortKey: 'zzzz', label: unsetLabel };
    if (!map.has(sortKey)) map.set(sortKey, { sortKey, label, items: [] });
    map.get(sortKey)!.items.push(item);
  }
  return [...map.values()]
    .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
    .map(g => [g.label, g.items]);
}

function groupByAssignee(items: ConfigItem[]) {
  const map = new Map<string, ConfigItem[]>();
  for (const item of items) {
    const key = item.assignee?.trim() || '미지정';
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(item);
  }
  return [...map.entries()].sort(([a], [b]) => {
    if (a === '미지정') return 1; if (b === '미지정') return -1;
    return a.localeCompare(b, 'ko');
  });
}

function groupByYear(items: ConfigItem[]) {
  return makeGroups(items, item => {
    const y = new Date(item.end_date!).getFullYear();
    return { sortKey: String(y), label: `${y}년` };
  });
}
function groupByMonth(items: ConfigItem[]) {
  return makeGroups(items, item => {
    const d = new Date(item.end_date!);
    const y = d.getFullYear(), m = d.getMonth() + 1;
    return { sortKey: `${y}-${String(m).padStart(2, '0')}`, label: `${y}년 ${m}월` };
  });
}
function groupByDay(items: ConfigItem[]) {
  return makeGroups(items, item => {
    const d = new Date(item.end_date!);
    const label = d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
    const sortKey = item.end_date!;
    return { sortKey, label };
  });
}

/* ── 보기 모드 메타 ── */
const VIEW_MODES: { mode: ViewMode; icon: string; label: string }[] = [
  { mode: 'list',       icon: '☰',  label: '목록'     },
  { mode: 'byAssignee', icon: '👤', label: '담당자별'  },
  { mode: 'byYear',     icon: '📅', label: '년별'      },
  { mode: 'byMonth',    icon: '📅', label: '월별'      },
  { mode: 'byDay',      icon: '📅', label: '일별'      },
];

export default function ConfigMgmtPage() {
  const [items, setItems] = useState<ConfigItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('in_progress');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('config_items').select('*').order('created_at', { ascending: false });
    if (!error) setItems(data ?? []);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('이 항목을 삭제하시겠습니까?')) return;
    const { error } = await supabase.from('config_items').delete().eq('id', id);
    if (!error) setItems(prev => prev.filter(i => i.id !== id));
  };

  const handleSetCurrent = async (e: React.MouseEvent, item: ConfigItem) => {
    e.stopPropagation();
    const newValue = !item.is_current;
    if (newValue) {
      // 같은 담당자의 기존 현재 작업중 항목만 해제
      const query = supabase.from('config_items').update({ is_current: false }).neq('id', item.id);
      if (item.assignee) {
        await query.eq('assignee', item.assignee);
      } else {
        await query.is('assignee', null);
      }
    }
    await supabase.from('config_items').update({ is_current: newValue }).eq('id', item.id);
    setItems(prev => prev.map(i => {
      if (i.id === item.id) return { ...i, is_current: newValue };
      if (newValue && i.assignee === item.assignee) return { ...i, is_current: false };
      return i;
    }));
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

  /* ── 행 렌더러 ── */
  const renderRow = (item: ConfigItem, idx: number, showAssignee: boolean) => {
    const remaining = getRemainingDays(item.end_date);
    const delayed = isDelayed(item);
    return (
      <div
        key={item.id}
        className={`${styles.listRow} ${item.is_current ? styles.rowCurrent : ''} ${delayed ? styles.rowDelayed : ''} ${idx % 2 === 1 && !item.is_current ? styles.rowAlt : ''}`}
        onClick={() => navigate(`/config-mgmt/${item.id}`)}
      >
        <div className={styles.colCurrent} onClick={e => e.stopPropagation()}>
          <button
            className={`${styles.btnCurrent} ${item.is_current ? styles.btnCurrentActive : ''}`}
            onClick={e => handleSetCurrent(e, item)}
            title={item.is_current ? '현재 작업중 해제' : '현재 작업중으로 설정'}
          >
            {item.is_current ? '▶' : ''}
          </button>
        </div>
        <div className={styles.colBadges}>
          <span className={`${styles.priorityBadge} ${styles[`priority_${item.priority}` as keyof typeof styles]}`}>{PRIORITY_LABEL[item.priority]}</span>
          <span className={`${styles.statusBadge} ${styles[`status_${item.status}` as keyof typeof styles]}`}>{STATUS_LABEL[item.status]}</span>
        </div>
        <div className={styles.colTitle}>
          <div className={styles.titleRow}>
            <span className={styles.rowTitle}>{item.title}</span>
            {item.updated_at && new Date(item.updated_at).getTime() - new Date(item.created_at).getTime() > 5000 && (
              <span className={styles.modifiedChip}>수정됨</span>
            )}
          </div>
          {item.description && <span className={styles.rowDesc}>{item.description.length > 55 ? item.description.slice(0, 55) + '...' : item.description}</span>}
        </div>
        {showAssignee && (
          <div className={styles.colAssignee}>
            {item.assignee
              ? <span className={styles.assigneeChip}>{item.assignee}</span>
              : <span className={styles.assigneeNone}>미지정</span>}
          </div>
        )}
        <div className={styles.colProgress}>
          <div className={styles.progressTop}>
            <span className={styles.progressBar}><span className={styles.progressFill} style={{ width: `${item.progress}%` }} /></span>
            <span className={styles.progressPct}>{item.progress}%</span>
          </div>
        </div>
        <div className={styles.colDate}>
          <span className={styles.dateText}>{formatDate(item.start_date)} ~ {formatDate(item.end_date)}</span>
          {remaining !== null && (
            <span className={`${styles.dday} ${delayed ? styles.ddayOverdue : remaining <= 7 ? styles.ddayUrgent : styles.ddayNormal}`}>
              {delayed ? `D+${Math.abs(remaining)} 지연` : remaining === 0 ? 'D-Day' : `D-${remaining}`}
            </span>
          )}
        </div>
        <div className={styles.colActions} onClick={e => e.stopPropagation()}>
          {user?.id === item.author_id ? (
            <>
              <button onClick={() => navigate(`/config-mgmt/${item.id}/edit`)} className={styles.btnEdit}>수정</button>
              <button onClick={() => handleDelete(item.id)} className={styles.btnDelete}>삭제</button>
            </>
          ) : <span className={styles.noAction}>—</span>}
        </div>
      </div>
    );
  };

  /* ── 그룹 뷰 렌더러 (공통) ── */
  const renderGrouped = (
    groups: [string, ConfigItem[]][],
    headerIcon: string,
    headerClass: string,
    showAssignee: boolean
  ) => (
    <div className={styles.groupedWrap}>
      {groups.map(([label, groupItems]) => (
        <div key={label} className={styles.group}>
          <div className={`${styles.groupHeader} ${headerClass}`}>
            <span className={styles.groupIcon}>{headerIcon}</span>
            <span className={styles.groupName}>{label}</span>
            <span className={styles.groupCount}>{groupItems.length}건</span>
            <span className={styles.groupAvg}>
              평균 진행률 {Math.round(groupItems.reduce((s, i) => s + i.progress, 0) / groupItems.length)}%
            </span>
            {groupItems.filter(isDelayed).length > 0 && (
              <span className={styles.groupDelayed}>⚠ 지연 {groupItems.filter(isDelayed).length}건</span>
            )}
          </div>
          <div className={styles.listWrap}>
            <div className={styles.listHeader}>
              <span className={styles.colCurrent} />
              <span className={styles.colBadges}>우선순위 / 상태</span>
              <span className={styles.colTitle}>제목 및 설명</span>
              {showAssignee && <span className={styles.colAssignee}>담당자</span>}
              <span className={styles.colProgress}>진행률</span>
              <span className={styles.colDate}>기간 / D-day</span>
              <span className={styles.colActions}>관리</span>
            </div>
            {groupItems.map((item, idx) => renderRow(item, idx, showAssignee))}
          </div>
        </div>
      ))}
    </div>
  );

  const renderContent = () => {
    if (loading) return <div className={styles.empty}><p>불러오는 중...</p></div>;
    if (filtered.length === 0) return (
      <div className={styles.empty}>
        <p>등록된 형상관리 항목이 없습니다.</p>
        {user && <Link to="/config-mgmt/new" className={styles.btnNewInline}>+ 첫 항목 등록하기</Link>}
      </div>
    );

    switch (viewMode) {
      case 'list':
        return (
          <div className={styles.listWrap}>
            <div className={styles.listHeader}>
              <span className={styles.colCurrent} />
              <span className={styles.colBadges}>우선순위 / 상태</span>
              <span className={styles.colTitle}>제목 및 설명</span>
              <span className={styles.colAssignee}>담당자</span>
              <span className={styles.colProgress}>진행률</span>
              <span className={styles.colDate}>기간 / D-day</span>
              <span className={styles.colActions}>관리</span>
            </div>
            {filtered.map((item, idx) => renderRow(item, idx, true))}
          </div>
        );
      case 'byAssignee':
        return renderGrouped(groupByAssignee(filtered), '👤', styles.headerGreen, false);
      case 'byYear':
        return renderGrouped(groupByYear(filtered), '📅', styles.headerBlue, true);
      case 'byMonth':
        return renderGrouped(groupByMonth(filtered), '🗓', styles.headerBlue, true);
      case 'byDay':
        return renderGrouped(groupByDay(filtered), '📆', styles.headerBlue, true);
    }
  };

  return (
    <div className={styles.page}>
      {/* 헤더 */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.heading}>형상관리</h1>
          <p className={styles.subHeading}>프로젝트 형상 항목의 진행 현황을 관리합니다</p>
        </div>
        {user && <Link to="/config-mgmt/new" className={styles.btnNew}>+ 새 항목 등록</Link>}
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
        <div className={`${styles.statCard} ${styles.statYellow}`} onClick={() => setFilter('planning')}>
          <span className={styles.statNumber}>{stats.planning}</span>
          <span className={styles.statLabel}>계획중</span>
        </div>
        <div className={`${styles.statCard} ${styles.statGreen}`} onClick={() => setFilter('completed')}>
          <span className={styles.statNumber}>{stats.completed}</span>
          <span className={styles.statLabel}>완료</span>
        </div>
        <div className={`${styles.statCard} ${styles.statGray}`} onClick={() => setFilter('on_hold')}>
          <span className={styles.statNumber}>{items.filter(i => i.status === 'on_hold').length}</span>
          <span className={styles.statLabel}>보류</span>
        </div>
      </div>

      {/* 현재 작업중 배너 (담당자별) */}
      {items.filter(i => i.is_current).length > 0 && (
        <div className={styles.currentBanners}>
          {items.filter(i => i.is_current).map(cur => (
            <div key={cur.id} className={styles.currentBanner} onClick={() => navigate(`/config-mgmt/${cur.id}`)}>
              <span className={styles.currentIcon}>▶</span>
              <div className={styles.currentInfo}>
                <span className={styles.currentLabel}>현재 작업중</span>
                <span className={styles.currentTitle}>{cur.title}</span>
              </div>
              {cur.assignee && <span className={styles.currentAssignee}>{cur.assignee}</span>}
              <div className={styles.currentProgress}>
                <span className={styles.currentPct}>{cur.progress}%</span>
                <div className={styles.currentBar}>
                  <div className={styles.currentFill} style={{ width: `${cur.progress}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 필터 탭 + 보기 토글 */}
      <div className={styles.tabsRow}>
        <div className={styles.tabs}>
          {([
            ['in_progress', '진행중', stats.inProgress],
            ['planning', '계획중', stats.planning],
            ['completed', '완료', stats.completed],
            ['on_hold', '보류', items.filter(i => i.status === 'on_hold').length],
            ['all', '전체', stats.total],
          ] as [FilterType, string, number | null][]).map(([val, label, count]) => (
            <button key={val} className={`${styles.tab} ${filter === val ? styles.tabActive : ''}`} onClick={() => setFilter(val)}>
              {label}
              {count !== null && <span className={styles.tabCount}>{count}</span>}
            </button>
          ))}
        </div>

        {/* 보기 모드 토글 */}
        <div className={styles.viewToggle}>
          {VIEW_MODES.map(({ mode, icon, label }, i) => (
            <>
              {/* 목록/담당자별 과 날짜별 사이 구분선 */}
              {i === 2 && <span key="sep" className={styles.viewSep} />}
              <button
                key={mode}
                className={`${styles.viewBtn} ${viewMode === mode ? styles.viewBtnActive : ''} ${i === 0 ? styles.viewBtnFirst : i === VIEW_MODES.length - 1 ? styles.viewBtnLast : ''}`}
                onClick={() => setViewMode(mode)}
              >
                {icon} {label}
              </button>
            </>
          ))}
        </div>
      </div>

      {renderContent()}
    </div>
  );
}
