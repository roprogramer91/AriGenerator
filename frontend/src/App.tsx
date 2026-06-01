import { Layout } from './components/Layout';
import { ConfigScreen } from './components/Config/ConfigScreen';
import { Step1Input } from './components/Step1/Step1Input';
import { Step2Prompt } from './components/Step2/Step2Prompt';
import { Step3Result } from './components/Step3/Step3Result';
import { useAppStore } from './store/useAppStore';

function CreateScreen() {
  const { createStep } = useAppStore();
  return (
    <>
      {createStep === 1 && <Step1Input />}
      {createStep === 2 && <Step2Prompt />}
      {createStep === 3 && <Step3Result />}
    </>
  );
}

function GalleryScreen() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center gap-4">
      <span className="text-5xl">🖼️</span>
      <h2 className="text-xl font-semibold text-[#f5f0eb]">Galería</h2>
      <p className="text-sm text-[#555]">Próximamente: todas tus generaciones acá.</p>
    </div>
  );
}

function App() {
  const { tab } = useAppStore();

  return (
    <Layout>
      {tab === 'create' && <CreateScreen />}
      {tab === 'gallery' && <GalleryScreen />}
      {tab === 'config' && <ConfigScreen />}
    </Layout>
  );
}

export default App;
