import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import styles from './Layout.module.css';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`;

  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link to="/config-mgmt" className={styles.logo}>
            📋 KDN 관리시스템
          </Link>
          <div className={styles.menuLinks}>
            <NavLink to="/config-mgmt" className={navLinkClass}>형상관리</NavLink>
            <NavLink to="/vacation" className={navLinkClass}>휴가관리</NavLink>
          </div>
          <nav className={styles.nav}>
            {user ? (
              <>
                <span className={styles.email}>{user.email}</span>
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
        <p>© 2026 KDN 관리시스템. Built with React + Supabase.</p>
      </footer>
    </div>
  );
}
