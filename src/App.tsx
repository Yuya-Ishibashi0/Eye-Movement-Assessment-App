import { BrowserRouter, Routes, Route } from 'react-router-dom';
import SetupPage from './pages/SetupPage';
import ExecutionPage from './pages/ExecutionPage';
import ResultPage from './pages/ResultPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SetupPage />} />
        <Route path="/execute" element={<ExecutionPage />} />
        <Route path="/result" element={<ResultPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
