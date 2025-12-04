"use client";

import React from "react";
import { useDispatch } from "react-redux";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";

import { createUser, updateUser } from "@/redux/actions/userActions";
import { toast } from "react-hot-toast";

export default function UserForm({ user, onSuccess }) {
  console.log(user, "sll");
  const dispatch = useDispatch();
  const isEdit = Boolean(user?.id);

  /* ------------------------------------------------------
     Validation Schema
  ------------------------------------------------------ */
  const schema = Yup.object().shape({
    username: Yup.string()
      .required("Username is required")
      .when([], {
        is: () => !isEdit,
        then: (s) => s.min(3, "Minimum 3 characters"),
      }),
    name: Yup.string().required("Full name is required"),
    email: Yup.string().email("Invalid email").required("Email is required"),
    role: Yup.string().required("Role is required"),
    mobileNo: Yup.string().nullable(),
    product: Yup.string().required("Product is required"),
  });

  /* ------------------------------------------------------
     Initial Values
  ------------------------------------------------------ */
  const initial = {
    username: user?.username || "",
    name: user?.name || "",
    email: user?.email || "",
    role: user?.role || "",
    mobileNo: user?.mobileNo || "",
    password: "",
    product: user?.product || "restaurant",
  };

  /* ------------------------------------------------------
     Submit Handler
  ------------------------------------------------------ */
  const handleSubmit = async (vals, { setSubmitting }) => {
    try {
      if (isEdit) {
        await dispatch(updateUser({ id: user._id, data: vals }));
        toast.success("User updated!");
      } else {
        await dispatch(createUser(vals));
        toast.success("User created!");
      }

      onSuccess(); // close modal
    } catch (e) {
      console.error(e);
      toast.error("Something went wrong");
    }

    setSubmitting(false);
  };

  /* ------------------------------------------------------
     RENDER
  ------------------------------------------------------ */
  return (
    <Formik
      initialValues={initial}
      validationSchema={schema}
      onSubmit={handleSubmit}
      enableReinitialize
    >
      {({ isSubmitting }) => (
        <Form className="space-y-4 w-full">
          {/* Responsive Grid: 1 column on mobile, 2 on desktop */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* USERNAME */}
            <div className="flex flex-col">
              <Label>Username *</Label>
              <Field
                as={Input}
                name="username"
                disabled={isEdit}
                placeholder="Enter username"
              />
              <ErrorMessage
                name="username"
                className="text-red-500 text-xs mt-1"
                component="div"
              />
            </div>

            {/* FULL NAME */}
            <div className="flex flex-col">
              <Label>Full Name *</Label>
              <Field as={Input} name="name" placeholder="Enter full name" />
              <ErrorMessage
                name="name"
                className="text-red-500 text-xs mt-1"
                component="div"
              />
            </div>

            {/* EMAIL */}
            <div className="flex flex-col">
              <Label>Email *</Label>
              <Field
                as={Input}
                name="email"
                type="email"
                placeholder="Enter email"
              />
              <ErrorMessage
                name="email"
                className="text-red-500 text-xs mt-1"
                component="div"
              />
            </div>

            {/* ROLE */}
            <div className="flex flex-col">
              <Label>Role *</Label>
              <Field
                as="select"
                name="role"
                disabled={isEdit}
                className="border rounded p-2 w-full bg-white"
              >
                <option value="">Select role</option>
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="staff">Staff</option>
              </Field>
              <ErrorMessage
                name="role"
                className="text-red-500 text-xs mt-1"
                component="div"
              />
            </div>

            {/* MOBILE */}
            <div className="flex flex-col">
              <Label>Mobile No</Label>
              <Field
                as={Input}
                name="mobileNo"
                placeholder="Enter mobile number"
              />
            </div>

            {/* PRODUCT */}
            <div className="flex flex-col">
              <Label>Product *</Label>
              <Field
                as="select"
                name="product"
                className="border rounded p-2 w-full bg-white"
              >
                <option value="restaurant">Restaurant</option>
                <option value="billing">Billing</option>
                <option value="inventory">Inventory</option>
              </Field>
              <ErrorMessage
                name="product"
                className="text-red-500 text-xs mt-1"
                component="div"
              />
            </div>
          </div>

          {/* FOOTER BUTTONS */}
          <div className="flex justify-end pt-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-orange-600 hover:bg-orange-700 w-full md:w-auto"
            >
              {isEdit ? "Save Changes" : "Create User"}
            </Button>
          </div>
        </Form>
      )}
    </Formik>
  );
}
