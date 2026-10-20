import React, { useState } from "react";
import InputFields from "../utils/InputFields";
import { Lock } from "lucide-react";
import httpClient from "../api/httpClient";
import toast from "react-hot-toast";

const UpdatePasswordUser = ({ onclose }) => {
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [isUpdating, setIsUpdating] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const isStrongPassword = (password) => {
    const hasCapital = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    return hasCapital && hasNumber;
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();

    const { currentPassword, newPassword, confirmPassword } = passwordData;

    // Validations
    if (!currentPassword) {
      return toast.error("Current password is required");
    }

    if (!newPassword) {
      return toast.error("New password is required");
    }

    if (newPassword.length < 8) {
      return toast.error("New password must be at least 8 characters long");
    }

    if (!isStrongPassword(newPassword)) {
      return toast.error(
        "New password must include at least 1 capital letter and 1 number"
      );
    }

    if (!confirmPassword) {
      return toast.error("Please confirm your new password");
    }

    if (newPassword !== confirmPassword) {
      return toast.error("New Password and confirm password do not match");
    }

    setIsUpdating(true);
    try {
      const { data } = await httpClient.put("update-password", passwordData);
      toast.success("Password updated successfully");
      onclose();
      setIsUpdating(false);
    } catch (err) {
      toast.error(
        err.response?.data?.message || err.message || "Something went wrong"
      );
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handlePasswordUpdate}>
      <InputFields
        LabelTitle={" Current Password"}
        placeholder={"Enter your current password"}
        required={true}
        inputVal={passwordData.currentPassword}
        type="password"
        icon={Lock}
        handleInputValue={handleChange}
        name={"currentPassword"}
      />
      <InputFields
        LabelTitle={"New Password"}
        placeholder={"Enter your new password"}
        required={true}
        inputVal={passwordData.newPassword}
        type="password"
        icon={Lock}
        handleInputValue={handleChange}
        name={"newPassword"}
      />
      <InputFields
        LabelTitle={"Confirm New Password"}
        placeholder={"Enter your confirm new password"}
        required={true}
        inputVal={passwordData.confirmPassword}
        type="password"
        icon={Lock}
        handleInputValue={handleChange}
        name={"confirmPassword"}
      />
      <div className="flex justify-between mt-2">
        <button className="btn-red-outline bg-transparent" onClick={onclose}>
          Cancel
        </button>
        <button className="btn-red" type="submit" disabled={isUpdating}>
          {isUpdating ? "Updating..." : "Update"}
        </button>
      </div>
    </form>
  );
};

export default UpdatePasswordUser;
