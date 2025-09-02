import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
const LoginPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const storeLogin = useAuthStore((state) => state.login);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm({
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const result = await storeLogin(data.email, data.password);
      const user = result?.user;
      toast.success('Login successful!');
      const role = user?.role;
      if (role === 'ADMIN') {
        navigate('/admin');
      } else if (role === 'FACULTY') {
        navigate('/faculty');
      } else {
        navigate('/');
      }
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage =
        error.response?.data?.message ||
        (error.response?.status === 401
          ? 'Invalid email or password'
          : 'An error occurred during login');

      setError('root', { type: 'manual', message: errorMessage });
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-2xl font-bold text-blue-600">
              R
            </div>
            <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
              Welcome back!
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Don't have an account yet?{' '}
              <Link
                to="/register"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Sign up now
              </Link>
            </p>
          </div>

          <div className="mt-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Email address
                </label>
                <div className="mt-1">
                  <input
                    {...register('email', {
                      required: 'Email is required',
                      pattern: {
                        value: /\S+@\S+\.\S+/,
                        message: 'Invalid email address',
                      },
                    })}
                    id="email"
                    type="email"
                    autoComplete="email"
                    className={`block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm ${
                      errors.email ? 'border-red-500' : ''
                    }`}
                  />
                  {errors.email && (
                    <p className="mt-2 text-sm text-red-600">
                      {errors.email.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700"
                >
                  Password
                </label>
                <div className="relative mt-1">
                  <input
                    {...register('password', {
                      required: 'Password is required',
                    })}
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    className={`block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm ${
                      errors.password ? 'border-red-500' : ''
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-2 text-sm text-red-600">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    {...register('rememberMe')}
                    id="remember-me"
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label
                    htmlFor="remember-me"
                    className="ml-2 block text-sm text-gray-900"
                  >
                    Remember me
                  </label>
                </div>

                <div className="text-sm">
                  <Link
                    to="/forgot-password"
                    className="font-medium text-blue-600 hover:text-blue-500"
                  >
                    Forgot password?
                  </Link>
                </div>
              </div>

              {errors.root && (
                <div className="rounded-md bg-red-50 p-4">
                  <p className="text-sm font-medium text-red-800">
                    {errors.root.message}
                  </p>
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-blue-400"
                >
                  {isLoading ? 'Logging in...' : 'Log in'}
                </button>
              </div>

              <div className="relative mt-6">
                <div
                  className="absolute inset-0 flex items-center"
                  aria-hidden="true"
                >
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white px-2 text-gray-500">OR</span>
                </div>
              </div>

              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => toast.error('SSO not implemented yet.')}
                  className="flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                >
                  Log in with SSO
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <div className="relative hidden w-0 flex-1 lg:block">
        <div
          className="absolute inset-0 h-full w-full object-cover"
          style={{
            backgroundColor: '#0A2540',
            backgroundImage: `
              radial-gradient(circle at 100% 100%, transparent 8%, #1499ff 8%, #1499ff 10%, transparent 10%),
              radial-gradient(circle at 0 0, transparent 8%, #1499ff 8%, #1499ff 10%, transparent 10%)`,
            backgroundSize: '40px 40px',
          }}
        />
      </div>
    </div>
  );
};

export default LoginPage;
