import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Post } from '../types';
import PostCard from '../components/PostCard';
import styles from './PostListPage.module.css';

const PAGE_SIZE = 9;

export default function PostListPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchPosts();
  }, [page]);

  const fetchPosts = async () => {
    setLoading(true);
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, count, error } = await supabase
      .from('posts')
      .select('*, profiles(email)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (!error) {
      setPosts(data ?? []);
      setTotal(count ?? 0);
    }
    setLoading(false);
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.heading}>게시판</h1>
        <span className={styles.count}>총 {total}개의 글</span>
      </div>

      {loading ? (
        <div className={styles.loading}>
          <div className="spinner" />
          <p>불러오는 중...</p>
        </div>
      ) : posts.length === 0 ? (
        <div className={styles.empty}>
          <p>아직 게시글이 없습니다.</p>
          <p>첫 번째 글을 작성해보세요!</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {posts.map(post => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className={styles.pageBtn}
          >
            ← 이전
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`${styles.pageBtn} ${p === page ? styles.active : ''}`}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className={styles.pageBtn}
          >
            다음 →
          </button>
        </div>
      )}
    </div>
  );
}
