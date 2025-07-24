import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';
import { useAuthStore } from './stores/authStore';
import { router } from './routes'; // Import the router from routes.tsx

function App() {
  const initialize = useAuthStore(state => state.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <>
      <RouterProvider 
        router={router} 
        future={{ 
          v7_startTransition: true
        }} 
      />
      <Toaster position="top-right" />
    </>
  );
}

export default App;