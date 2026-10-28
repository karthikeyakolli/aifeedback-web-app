import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, ArrowLeft } from 'lucide-react';
import { Button } from '../components/common/Button';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="py-20 text-center space-y-4 max-w-md mx-auto">
      <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400 mx-auto mb-2">
        <Compass className="w-8 h-8" />
      </div>
      <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">
        404 — Page Not Found
      </h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
        The link you followed does not correspond to an active product discussion or route.
      </p>
      <div className="pt-2">
        <Link to="/">
          <Button size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Return to Feed
          </Button>
        </Link>
      </div>
    </div>
  );
};
