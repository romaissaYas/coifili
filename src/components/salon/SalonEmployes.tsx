import type { EmployePublic } from '@/types/booking';

/** Employés du salon (professionnels disponibles). */
export default function SalonEmployes({ employes }: { employes: EmployePublic[] }) {
  if (employes.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Nos professionnels</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {employes.map((e) => (
          <div key={e.id} className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
            <p className="font-medium text-gray-800">{e.nom}</p>
            <p className="text-sm text-gray-500">{e.poste}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
