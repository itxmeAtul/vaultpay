export default function StatsCard({ title, amount, color }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition">
      <h4 className="text-gray-600">{title}</h4>
      <h2 className={`text-3xl font-bold mt-2 ${color}`}>{amount}</h2>
    </div>
  );
}
