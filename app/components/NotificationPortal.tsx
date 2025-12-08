'use client';

import { useEffect, useState } from 'react';
import NotificationCenter from './NotificationCenter';

export default function NotificationPortal() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return <NotificationCenter />;
}
