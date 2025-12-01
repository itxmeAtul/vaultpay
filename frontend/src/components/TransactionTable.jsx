export default function TransactionTable({ data = [] }) {
  return (
    <table className="w-full bg-white shadow rounded-xl overflow-hidden">
      <thead className="bg-primary text-white">
        <tr>
          <th className="p-3 text-left">Name</th>
          <th className="p-3 text-left">Amount</th>
          <th className="p-3 text-left">Date</th>
        </tr>
      </thead>

      <tbody>
        {data.map((t, i) => (
          <tr key={i} className="border-b">
            <td className="p-3">{t.name}</td>
            <td className="p-3">{t.amount}</td>
            <td className="p-3">{t.date}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
