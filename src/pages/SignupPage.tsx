import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import styles from './AuthPage.module.css';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }
    if (password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다.');
      return;
    }
    setLoading(true);
    const { error } = await signUp(email, password);
    setLoading(false);
    if (error) {
      setError('회원가입에 실패했습니다. 다시 시도해주세요.');
    } else {
      setMessage('이메일 인증 링크를 확인해주세요. 인증 후 로그인 가능합니다.');
      setTimeout(() => navigate('/login'), 3000);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>회원가입</h1>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>이메일</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className={styles.input}
              placeholder="example@email.com"
              required
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className={styles.input}
              placeholder="6자 이상 입력하세요"
              required
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>비밀번호 확인</label>
            <input
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              className={styles.input}
              placeholder="비밀번호를 다시 입력하세요"
              required
            />
          </div>
          {error && <p className={styles.error}>{error}</p>}
          {message && <p className={styles.success}>{message}</p>}
          <button type="submit" disabled={loading} className={styles.btn}>
            {loading ? '가입 중...' : '회원가입'}
          </button>
        </form>
        <p className={styles.footer}>
          이미 계정이 있으신가요? <Link to="/login" className={styles.link}>로그인</Link>
        </p>
      </div>
    </div>
  );
}
