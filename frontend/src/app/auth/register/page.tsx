import RegisterForm from '@/features/auth/ui/RegisterForm';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Регистрация в системе',
  description: 'Регистрация в системе',
};

const RegisterPage = () => {
  return <RegisterForm />;
};

export default RegisterPage;
