import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import styles from './PostFormPage.module.css';

export default function PostCreatePage() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError('제목과 내용을 모두 입력해주세요.');
      return;
    }
    setLoading(true);
    setError('');
    const { data, error } = await supabase.from('posts').insert({
      title: title.trim(),
      content: content.trim(),
      author_id: user!.id,
    }).select().single();

    setLoading(false);
    if (error) {
      setError('게시글 등록에 실패했습니다.');
    } else {
      navigate(`/posts/${data.id}`);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link to="/" className={styles.back}>← 목록으로</Link>
        <h1 className={styles.title}>새 글 작성</h1>
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
          <Link to="/" className={styles.cancelBtn}>취소</Link>
          <button type="submit" disabled={loading} className={styles.submitBtn}>
            {loading ? '등록 중...' : '등록하기'}
          </button>
        </div>
      </form>
    </div>
  );
}
