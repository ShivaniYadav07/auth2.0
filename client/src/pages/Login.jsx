import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loginSchema } from '../schemas/authSchemas';
import { getErrorMessage } from '../utils/apiError';
import Alert from '../components/ui/Alert';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const labelCls = 'mb-1.5 block text-sm font-medium text-gray-900 dark:text-gray-100';
const fieldCls = 'mb-4 text-left';
const errorCls = 'mt-1 text-xs text-red-500';

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
    <main className="mx-auto w-full max-w-[720px] flex-1 px-6 py-10">
      <h1 className="my-8 text-4xl font-semibold text-gray-900 dark:text-gray-100">Log in</h1>

      <Alert>{serverError}</Alert>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className={fieldCls}>
          <label htmlFor="email" className={labelCls}>
            Email
          </label>
          <Input id="email" type="email" autoComplete="email" hasError={!!errors.email} {...register('email')} />
          {errors.email && <p className={errorCls}>{errors.email.message}</p>}
        </div>

        <div className={fieldCls}>
          <label htmlFor="password" className={labelCls}>
            Password
          </label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            hasError={!!errors.password}
            {...register('password')}
          />
          {errors.password && <p className={errorCls}>{errors.password.message}</p>}
        </div>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Logging in…' : 'Log in'}
        </Button>
      </form>

      <p className="mt-5 text-sm text-gray-500">
        Don't have an account?{' '}
        <Link to="/register" className="text-violet-600 dark:text-violet-400">
          Register
        </Link>
      </p>
    </main>
  );
}
