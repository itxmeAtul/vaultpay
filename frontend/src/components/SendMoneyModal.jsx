import * as Dialog from "@radix-ui/react-dialog";

export default function SendMoneyModal() {
  return (
    <Dialog.Root>
      <Dialog.Trigger className="bg-primary text-white px-4 py-2 rounded-lg">
        Send Money
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/30" />

        <Dialog.Content
          className="fixed top-1/2 left-1/2 bg-white p-6 rounded-xl shadow-lg 
          -translate-x-1/2 -translate-y-1/2 w-96"
        >
          <Dialog.Title className="text-xl font-semibold mb-4">
            Send Money
          </Dialog.Title>

          <input
            className="border p-3 w-full rounded mb-4"
            placeholder="Recipient"
          />
          <input
            className="border p-3 w-full rounded mb-4"
            placeholder="Amount"
          />

          <button className="bg-primary text-white px-4 py-2 rounded-lg w-full">
            Send
          </button>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
