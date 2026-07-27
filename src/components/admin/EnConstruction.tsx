export default function EnConstruction({ titre }: { titre: string }) {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">{titre}</h1>
      <p className="rounded-xl border border-dashed border-gray-200 bg-white p-10 text-center text-gray-500">
        Section disponible dans la prochaine étape (Phase 5 — partie 2).
      </p>
    </div>
  );
}
