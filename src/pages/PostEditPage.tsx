import { useState, useEffect, FormEvent } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import styles from './PostFormPage.module.css';

export default function PostEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        navigate('/');
        return;
      }
      if (data.author_id !== user?.id) {
        navigate('/');
        return;
      }
      setTitle(data.title);
      setContent(data.content);
      setFetching(false);
    };
    fetchPost();
  }, [id]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError('제목과 내용을 모두 입력해주세요.');
      return;
    }
    setLoading(true);
    setError('');
    const { error } = await supabase
      .from('posts')
      .update({ title: title.trim(), content: content.trim() })
      .eq('id', id);

    setLoading(false);
    if (error) {
      setError('수정에 실패했습니다.');
    } else {
      navigate(`/posts/${id}`);
    }
  };

  if (fetching) {
    return (
      <div className={styles.loadingWrap}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link to={`/posts/${id}`} className={styles.back}>← 돌아가기</Link>
        <h1 className={styles.title}>글 수정</h1>
      </div>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label className={styles.label}>제목</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className={styles.input}
            placeholder="제목을 입력하세요"
            maxLength={200}
            required
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>내용</label>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            className={styles.textarea}
            placeholder="내용을 입력하세요"
            rows={14}
            required
          />
        </div>
        {error && <p className={styles.error}>{error}</p>}
        <div className={styles.btnRow}>
          <Link to={`/posts/${id}`} className={styles.cancelBtn}>취소</Link>
          <button type="submit" disabled={loading} className={styles.submitBtn}>
            {loading ? '수정 중...' : '수정하기'}
          </button>
        </div>
      </form>
    </div>
  );
}
