/**
 * Root page — MedSlot landing page placeholder.
 *
 * This scaffold will be replaced in TASK-040 (Doctor Search & Landing Page).
 * The full landing page implementation (hero section, specialty dropdown, city input)
 * is defined in TASK-040 and WIREFRAMES.md SCR-001.
 */

export default function Home(): JSX.Element {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold text-primary-700">MedSlot</h1>
      <p className="mt-4 text-lg text-gray-600">
        Healthcare appointment platform — coming soon.
      </p>
    </main>
  );
}
