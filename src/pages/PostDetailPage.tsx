import { useEffect, useState, FormEvent } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Post, Comment } from '../types';
import styles from './PostDetailPage.module.css';

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchPost();
    fetchComments();
  }, [id]);

  const fetchPost = async () => {
    const { data, error } = await supabase
      .from('posts')
      .select('*, profiles(email)')
      .eq('id', id)
      .single();
    if (error || !data) {
      navigate('/');
      return;
    }
    setPost(data);
    setLoading(false);
  };

  const fetchComments = async () => {
    const { data } = await supabase
      .from('comments')
      .select('*, profiles(email)')
      .eq('post_id', id)
      .order('created_at', { ascending: true });
    setComments(data ?? []);
  };

  const handleDelete = async () => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    setDeleting(true);
    await supabase.from('posts').delete().eq('id', id);
    navigate('/');
  };

  const handleCommentSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !user) return;
    setSubmitting(true);
    await supabase.from('comments').insert({
      post_id: id,
      content: commentText.trim(),
      author_id: user.id,
    });
    setCommentText('');
    await fetchComments();
    setSubmitting(false);
  };

  const handleCommentDelete = async (commentId: string) => {
    if (!confirm('댓글을 삭제하시겠습니까?')) return;
    await supabase.from('comments').delete().eq('id', commentId);
    await fetchComments();
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className="spinner" />
      </div>
    );
  }

  if (!post) return null;

  const isAuthor = user?.id === post.author_id;
  const postDate = new Date(post.created_at).toLocaleString('ko-KR');

  return (
    <div className={styles.container}>
      <Link to="/" className={styles.back}>← 목록으로</Link>

      <article className={styles.article}>
        <h1 className={styles.title}>{post.title}</h1>
        <div className={styles.meta}>
          <span className={styles.author}>{post.profiles?.email}</span>
          <span className={styles.date}>{postDate}</span>
          {isAuthor && (
            <div className={styles.actions}>
              <Link to={`/posts/${id}/edit`} className={styles.editBtn}>수정</Link>
              <button onClick={handleDelete} disabled={deleting} className={styles.deleteBtn}>
                {deleting ? '삭제 중...' : '삭제'}
              </button>
            </div>
          )}
        </div>
        <div className={styles.content}>{post.content}</div>
      </article>

      <section className={styles.commentSection}>
        <h2 className={styles.commentHeading}>댓글 {comments.length}개</h2>

        {user && (
          <form onSubmit={handleCommentSubmit} className={styles.commentForm}>
            <textarea
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              className={styles.commentInput}
              placeholder="댓글을 입력하세요..."
              rows={3}
              required
            />
            <button type="submit" disabled={submitting} className={styles.commentBtn}>
              {submitting ? '등록 중...' : '댓글 등록'}
            </button>
          </form>
        )}

        <div className={styles.commentList}>
          {comments.length === 0 ? (
            <p className={styles.noComment}>첫 번째 댓글을 남겨보세요!</p>
          ) : (
            comments.map(comment => (
              <div key={comment.id} className={styles.commentItem}>
                <div className={styles.commentMeta}>
                  <span className={styles.commentAuthor}>{comment.profiles?.email}</span>
                  <span className={styles.commentDate}>
                    {new Date(comment.created_at).toLocaleString('ko-KR')}
                  </span>
                  {user?.id === comment.author_id && (
                    <button
                      onClick={() => handleCommentDelete(comment.id)}
                      className={styles.commentDelete}
                    >
                      삭제
                    </button>
                  )}
                </div>
                <p className={styles.commentContent}>{comment.content}</p>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
