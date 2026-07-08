import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { registerSchema } from '../schemas/authSchemas';
import { getErrorMessage, getFieldErrors } from '../utils/apiError';
import Alert from '../components/ui/Alert';

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
    <main>
      <h1>Create an account</h1>
      <p className="muted">This registers you as the resource owner on the auth server.</p>

      <Alert>{serverError}</Alert>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="form-field">
          <label htmlFor="name">Name</label>
          <input id="name" type="text" autoComplete="name" {...register('name')} />
          {errors.name && <p className="form-error">{errors.name.message}</p>}
        </div>

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
            autoComplete="new-password"
            {...register('password')}
          />
          {errors.password && <p className="form-error">{errors.password.message}</p>}
          <p className="form-hint">
            8+ characters, with at least one lowercase letter, one uppercase letter, and one
            number.
          </p>
        </div>

        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="muted" style={{ marginTop: 20 }}>
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </main>
  );
}
