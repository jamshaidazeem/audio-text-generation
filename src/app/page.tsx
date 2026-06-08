import { UploadMp3 } from "@/components/UploadMp3";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-6 py-16 sm:px-10">
        <div className="w-full">
          <header className="mb-6">
            <h1 className="text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
              Audio → Text (starter)
            </h1>
            <p className="mt-2 max-w-2xl text-base leading-7 text-zinc-600 dark:text-zinc-400">
              Upload an MP3 and transcribe it on your device with Whisper Tiny,
              or use server mode to send audio to OpenAI. On-device mode keeps
              audio in your browser; server mode requires an API key.
            </p>
          </header>

          <UploadMp3 />
        </div>
      </main>
    </div>
  );
}
