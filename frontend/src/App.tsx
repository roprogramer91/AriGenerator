import { Layout } from './components/Layout';
import { ConfigScreen } from './components/Config/ConfigScreen';
import { Step1Input } from './components/Step1/Step1Input';
import { Step2Prompt } from './components/Step2/Step2Prompt';
import { Step3Result } from './components/Step3/Step3Result';
import { GalleryScreen } from './components/Gallery/GalleryScreen';
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

function App() {
  const { tab } = useAppStore();

  return (
    <Layout>
      {tab === 'create' && <CreateScreen />}
      {tab === 'gallery' && <GalleryScreen key="gallery" />}
      {tab === 'config' && <ConfigScreen />}
    </Layout>
  );
}

export default App;
