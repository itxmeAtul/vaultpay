import TransactionTable from "../components/TransactionTable";

export default function Transactions() {
  return (
    <div className="ml-64 p-6">
      <h1 className="text-2xl font-bold mb-4">All Transactions</h1>
      <TransactionTable />
    </div>
  );
}
