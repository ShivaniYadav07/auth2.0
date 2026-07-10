import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { registerSchema } from '../schemas/authSchemas';
import { getErrorMessage, getFieldErrors } from '../utils/apiError';
import Alert from '../components/ui/Alert';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const labelCls = 'mb-1.5 block text-sm font-medium text-gray-900 dark:text-gray-100';
const fieldCls = 'mb-4 text-left';
const errorCls = 'mt-1 text-xs text-red-500';
const hintCls = 'mt-1 text-xs text-gray-500';

export default function Register() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(registerSchema) });

  async function onSubmit(values) {
    setServerError('');
    try {
      await registerUser(values);
      navigate('/dashboard');
    } catch (err) {
      const fieldErrors = getFieldErrors(err);
      if (fieldErrors) {
        fieldErrors.forEach((fe) => setError(fe.field, { message: fe.message }));
      }
      setServerError(getErrorMessage(err));
    }
  }

  return (
    <main className="mx-auto w-full max-w-[720px] flex-1 px-6 py-10">
      <h1 className="my-8 text-4xl font-semibold text-gray-900 dark:text-gray-100">
        Create an account
      </h1>
      <p className="text-sm text-gray-500">
        This registers you as the resource owner on the auth server.
      </p>

      <Alert>{serverError}</Alert>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6">
        <div className={fieldCls}>
          <label htmlFor="name" className={labelCls}>
            Name
          </label>
          <Input id="name" type="text" autoComplete="name" hasError={!!errors.name} {...register('name')} />
          {errors.name && <p className={errorCls}>{errors.name.message}</p>}
        </div>

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
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              hasError={!!errors.password}
              className="pr-10"
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-650 dark:hover:text-gray-200 cursor-pointer focus:outline-none"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.815 7.815 3 3m-3-3-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                  />
                </svg>
              )}
            </button>
          </div>
          {errors.password && <p className={errorCls}>{errors.password.message}</p>}
          <p className={hintCls}>
            8+ characters, with at least one lowercase letter, one uppercase letter, and one number.
          </p>
        </div>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating account…' : 'Create account'}
        </Button>
      </form>

      <p className="mt-5 text-sm text-gray-500">
        Already have an account?{' '}
        <Link to="/login" className="text-violet-600 dark:text-violet-400">
          Log in
        </Link>
      </p>
    </main>
  );
}
