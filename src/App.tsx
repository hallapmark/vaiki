import './App.css'
import {HlsPlayer} from "./components/HlsPlayer.tsx";

function App() {

  return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-4 md:p-8">
          <div className="w-full max-w-[min(1400px,142vh)] aspect-video max-h-[80vh]">
              <HlsPlayer
              src="sourcegoeshere"
              className="w-full h-full shadow-2xl"
              />
          </div>
      </div>
  )
}

export default App
