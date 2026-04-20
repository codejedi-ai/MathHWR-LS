import { useState } from 'preact/hooks';
import VantaBackground from '../components/VantaBackground';

interface LoginPageProps {
    onLoginSuccess: (username: string) => void;
}

export default function LoginPage({ onLoginSuccess }: LoginPageProps) {
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const getCookie = (name: string) => {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    };

    const handleSubmit = async (e: Event) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const endpoint = isLogin ? '/api/login/' : '/api/signup/';

        try {
            await fetch('/api/csrf/');
            const csrftoken = getCookie('csrftoken');

            const payload = isLogin 
                ? { username, password } 
                : { username, password, email };

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrftoken || '',
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (response.ok) {
                onLoginSuccess(data.username);
            } else {
                setError(data.error || (isLogin ? 'Login failed' : 'Signup failed'));
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <VantaBackground />
            <div className="auth-card">
                <h2 className="auth-title">
                    {isLogin ? 'LOGIN' : 'SIGN UP'}
                </h2>
                <form onSubmit={handleSubmit}>
                    <div className="auth-form-group">
                        <label className="auth-label">Username</label>
                        <input
                            type="text"
                            className="auth-input"
                            value={username}
                            onInput={(e) => setUsername((e.target as HTMLInputElement).value)}
                            required
                        />
                    </div>
                    {!isLogin && (
                        <div className="auth-form-group">
                            <label className="auth-label">Email (Optional)</label>
                            <input
                                type="email"
                                className="auth-input"
                                value={email}
                                onInput={(e) => setEmail((e.target as HTMLInputElement).value)}
                            />
                        </div>
                    )}
                    <div className="auth-form-group">
                        <label className="auth-label">Password</label>
                        <input
                            type="password"
                            className="auth-input"
                            value={password}
                            onInput={(e) => setPassword((e.target as HTMLInputElement).value)}
                            required
                        />
                    </div>
                    {error && <div className="auth-error">{error}</div>}
                    <button
                        type="submit"
                        className="auth-button"
                        disabled={loading}
                    >
                        {loading ? 'Processing...' : (isLogin ? 'LOGIN' : 'SIGN UP')}
                    </button>
                    <div className="auth-switch">
                        {isLogin ? "Don't have an account? " : "Already have an account? "}
                        <span 
                            className="auth-link"
                            onClick={() => { setIsLogin(!isLogin); setError(''); }}
                        >
                            {isLogin ? 'Sign Up' : 'Login'}
                        </span>
                    </div>
                </form>
            </div>
        </div>
    );
}
