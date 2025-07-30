'use client';

import { useState } from 'react';

type RendezVous = {
  date: string;
  heure: string;
  client: string;
  prestation: string;
  montant: number;
};

const appointments: RendezVous[] = [
  { date: '2025-07-27', heure: '10:00', client: 'Sarah', prestation: 'Brushing', montant: 2500 },
  { date: '2025-07-27', heure: '14:00', client: 'Nour', prestation: 'Coupe', montant: 3000 },
  { date: '2025-07-26', heure: '16:00', client: 'Sami', prestation: 'Coloration', montant: 5000 },
  { date: '2025-07-01', heure: '09:00', client: 'Yasmine', prestation: 'Lissage', montant: 7000 },
  { date: '2025-07-15', heure: '11:30', client: 'Ines', prestation: 'Balayage', montant: 4500 },
];

export default function AgendaPage() {
  const [selectedDate, setSelectedDate] = useState('');

  const filteredAppointments = selectedDate
    ? appointments.filter((a) => a.date === selectedDate)
    : appointments;

  const sortedAppointments = filteredAppointments.sort(
    (a, b) =>
      new Date(`${a.date}T${a.heure}`).getTime() - new Date(`${b.date}T${b.heure}`).getTime()
  );

  return (
    <div className="min-h-screen bg-rose-50 py-10 px-6">
      <h1 className="text-4xl font-bold text-rose-700 mb-6">Agenda</h1>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">Filtrer par date :</label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:ring-rose-500 focus:border-rose-500"
        />
      </div>

      <div className="space-y-4">
        {sortedAppointments.map((rdv, idx) => (
          <div
            key={idx}
            className="bg-white shadow-sm rounded-xl p-4 flex justify-between items-center border border-gray-100"
          >
            <div>
              <p className="text-lg font-semibold text-gray-900">{rdv.client}</p>
              <p className="text-sm text-gray-600">
                {rdv.prestation} — {rdv.heure}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">
                {new Date(rdv.date).toLocaleDateString('fr-FR')}
              </p>
              <p className="text-xl font-bold text-rose-600">{rdv.montant} DA</p>
            </div>
          </div>
        ))}

        {sortedAppointments.length === 0 && (
          <p className="text-gray-500 italic">Aucun rendez-vous trouvé pour cette date.</p>
        )}
      </div>
    </div>
  );
}
