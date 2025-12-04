import React, { useState } from "react";
import ListingLayout from "@/components/layout/ListingLayout";
import { getUsers, deleteUser } from "@/redux/actions/userActions";
import { Button } from "@/components/ui/button";
import AppModal from "@/components/common/AppModal";
import UserForm from "./components/UserModal";

export default function UsersListing() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const columns = [
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "role", label: "Role" },
  ];

  const actions = (row) => (
    <>
      <Button
        variant="outline"
        className="mr-2"
        onClick={() => {
          setModalOpen(true);
          setSelectedUser(row);
        }}
      >
        Edit
      </Button>

      <Button variant="destructive" onClick={() => deleteUser(row._id)}>
        Delete
      </Button>
    </>
  );

  return (
    <>
      <AppModal
        title={"Add / Edit User"}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      >
        <UserForm user={selectedUser} onSuccess={() => setSelectedUser(null)} />
      </AppModal>
      <ListingLayout
        title="Users"
        selectorKey="users"
        fetchAction={getUsers}
        columns={columns}
        actions={actions}
        extraControls={
          <Button onClick={setModalOpen} className="bg-orange-600 text-white">
            + Add User
          </Button>
        }
      />
    </>
  );
}
