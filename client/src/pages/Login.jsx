import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loginSchema } from '../schemas/authSchemas';
import { getErrorMessage } from '../utils/apiError';
import Alert from '../components/ui/Alert';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values) {
    setServerError('');
    try {
      await login(values);
      const redirectTo = location.state?.from?.pathname ?? '/dashboard';
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setServerError(getErrorMessage(err));
    }
  }

  return (
    <main>
      <h1>Log in</h1>

      <Alert>{serverError}</Alert>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="form-field">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" autoComplete="email" {...register('email')} />
          {errors.email && <p className="form-error">{errors.email.message}</p>}
        </div>

        <div className="form-field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            {...register('password')}
          />
          {errors.password && <p className="form-error">{errors.password.message}</p>}
        </div>

        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Logging in…' : 'Log in'}
        </button>
      </form>

      <p className="muted" style={{ marginTop: 20 }}>
        Don't have an account? <Link to="/register">Register</Link>
      </p>
    </main>
  );
}
