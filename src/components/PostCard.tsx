import { Link } from 'react-router-dom';
import { Post } from '../types';
import styles from './PostCard.module.css';

interface Props {
  post: Post;
}

export default function PostCard({ post }: Props) {
  const date = new Date(post.created_at).toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'short', day: 'numeric',
  });

  const preview = post.content.length > 120 ? post.content.slice(0, 120) + '...' : post.content;

  return (
    <Link to={`/posts/${post.id}`} className={styles.card}>
      <h2 className={styles.title}>{post.title}</h2>
      <p className={styles.preview}>{preview}</p>
      <div className={styles.meta}>
        <span className={styles.author}>{post.profiles?.email ?? '알 수 없음'}</span>
        <span className={styles.date}>{date}</span>
      </div>
    </Link>
  );
}
