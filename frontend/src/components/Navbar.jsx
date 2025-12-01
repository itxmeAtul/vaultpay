export default function Navbar() {
  return (
    <div className="w-full bg-card p-4 border-b border-gray-700 flex justify-between">
      <h2 className="text-xl font-bold">Dashboard</h2>
      <button
        onClick={() => {
          localStorage.clear();
          window.location = "/";
        }}
        className="bg-primary px-4 py-2 rounded"
      >
        Logout
      </button>
    </div>
  );
}
