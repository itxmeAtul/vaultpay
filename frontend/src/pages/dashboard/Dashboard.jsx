import React from "react";
import { ArrowUpRight, ArrowDownRight, CreditCard, Wallet } from "lucide-react";

export default function Dashboard() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <h1 className="text-2xl font-semibold text-gray-800">Dashboard</h1>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Wallet Balance */}
        <div className="p-6 bg-white rounded-xl shadow hover:shadow-lg transition">
          <p className="text-gray-500">Wallet Balance</p>
          <h2 className="text-3xl font-bold mt-2">₹ 42,580.40</h2>
          <div className="flex items-center gap-2 mt-4 text-green-600">
            <ArrowUpRight />
            <span>+12% this month</span>
          </div>
        </div>

        {/* Income */}
        <div className="p-6 bg-white rounded-xl shadow hover:shadow-lg transition">
          <p className="text-gray-500">Income</p>
          <h2 className="text-3xl font-bold mt-2">₹ 87,200</h2>
          <div className="flex items-center gap-2 mt-4 text-green-600">
            <ArrowUpRight />
            <span>+8% from last month</span>
          </div>
        </div>

        {/* Expenses */}
        <div className="p-6 bg-white rounded-xl shadow hover:shadow-lg transition">
          <p className="text-gray-500">Expenses</p>
          <h2 className="text-3xl font-bold mt-2">₹ 38,900</h2>
          <div className="flex items-center gap-2 mt-4 text-red-600">
            <ArrowDownRight />
            <span>-5% from last month</span>
          </div>
        </div>
      </div>

      {/* Transactions + Shortcuts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions */}
        <div className="lg:col-span-2 p-6 bg-white rounded-xl shadow">
          <h2 className="text-lg font-semibold mb-4">Recent Transactions</h2>

          <div className="space-y-4">
            {/* Transaction Row */}
            {[
              { name: "Amazon", amount: "-₹2,499", type: "debit" },
              { name: "Salary", amount: "+₹32,000", type: "credit" },
              { name: "Zomato", amount: "-₹740", type: "debit" },
            ].map((tx, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-3 border-b"
              >
                <span className="font-medium">{tx.name}</span>
                <span
                  className={`font-semibold ${
                    tx.type === "debit" ? "text-red-600" : "text-green-600"
                  }`}
                >
                  {tx.amount}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="p-6 bg-white rounded-xl shadow">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>

          <div className="space-y-3">
            <button className="w-full p-3 bg-orange-500 text-white rounded-lg flex items-center gap-3">
              <Wallet /> Add Money
            </button>

            <button className="w-full p-3 bg-orange-500 text-white rounded-lg flex items-center gap-3">
              <CreditCard /> Pay Bills
            </button>

            <button className="w-full p-3 bg-orange-500 text-white rounded-lg flex items-center gap-3">
              <ArrowUpRight /> Send Money
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
