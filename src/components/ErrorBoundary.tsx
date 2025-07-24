import { useRouteError } from 'react-router-dom';

export default function ErrorBoundary() {
  const error = useRouteError();
  console.error(error);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <h1 className="text-2xl font-bold text-red-600">Oops!</h1>
        <p className="text-gray-600">Sorry, an unexpected error has occurred.</p>
        <p className="text-gray-500">
          {(error as Error)?.message || 'Unknown error occurred'}
        </p>
      </div>
    </div>
  );
}
