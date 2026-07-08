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
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            hasError={!!errors.password}
            {...register('password')}
          />
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
