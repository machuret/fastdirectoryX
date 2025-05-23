import { useEffect } from 'react';
import { useRouter } from 'next/router';

const AdminIndexPage = () => {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/dashboard'); // Or your preferred default admin page
  }, [router]);

  return null; // Or a loading spinner, but redirect should be fast
};

export default AdminIndexPage;
