import { Layout } from './components/Layout';
import { ConfigScreen } from './components/Config/ConfigScreen';
import { useAppStore } from './store/useAppStore';

function CreateScreen() {
  const { setTab } = useAppStore();
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center gap-4">
      <span className="text-5xl">✨</span>
      <h2 className="text-xl font-semibold text-[#f5f0eb]">Generá una foto de Ari</h2>
      <p className="text-sm text-[#555] max-w-xs">
        Próximamente: escribí una idea o subí una foto de referencia y la app genera la imagen.
      </p>
      <button
        type="button"
        onClick={() => setTab('config')}
        className="mt-2 text-sm text-[#ff6b6b] underline underline-offset-4"
      >
        Primero configurá las fotos de Ari ⚙️
      </button>
    </div>
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
