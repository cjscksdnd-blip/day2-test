import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import styles from './Layout.module.css';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link to="/" className={styles.logo}>
            📋 Board
          </Link>
          <nav className={styles.nav}>
            {user ? (
              <>
                <span className={styles.email}>{user.email}</span>
                <Link to="/posts/new" className={styles.btnPrimary}>글쓰기</Link>
                <button onClick={handleSignOut} className={styles.btnOutline}>로그아웃</button>
              </>
            ) : (
              <>
                <Link to="/login" className={styles.btnOutline}>로그인</Link>
                <Link to="/signup" className={styles.btnPrimary}>회원가입</Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className={styles.main}>{children}</main>
      <footer className={styles.footer}>
        <p>© 2026 Board App. Built with React + Supabase.</p>
      </footer>
    </div>
  );
}
