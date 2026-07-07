import React from 'react';
import { ROUTES } from '@/lib/constants';

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-12">
      <div className="flex max-w-md flex-col items-center gap-4 text-center">
        <h1 className="text-primary/20 text-9xl leading-none font-black select-none">404</h1>
        <h2 className="text-base-content text-3xl font-bold">Page Not Found</h2>
        <p className="text-base-content/60 text-sm">
          Sorry, the page you are looking for might have been removed, had its name changed, or is
          temporarily unavailable.
        </p>
        <div className="mt-4">
          <a href={ROUTES.HOME} className="btn btn-primary btn-sm px-6">
            Go Back Home
          </a>
        </div>
      </div>
    </div>
  );
}
