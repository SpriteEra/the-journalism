import { useState, useEffect, useRef, useContext } from "react";
import "./PasswordResetPopup.css";
import httpClient from "../../api/httpClient";
import toast from "react-hot-toast";
import InputFields from "../../utils/InputFields";
import { Lock } from "lucide-react";

const DeleteEventCategory = ({ event, setIsDelete, refetch }) => {
  const [otp, setOtp] = useState(Array(6).fill(""));
  const [otpSent, setOtpSent] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const otpRefs = useRef([]);

  // Handle OTP input change
  const handleChange = (e, index) => {
    const { value } = e.target;
    if (value.length <= 1 && /^[0-9]*$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      // Focus the next input
      if (index < otp.length - 1 && value !== "") {
        otpRefs.current[index + 1].focus();
      }
    }
  };

  // Handle focus on previous input when backspace is pressed
  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && otp[index] === "" && index > 0) {
      otpRefs.current[index - 1].focus();
    }
  };

  const handleSendOtp = (e) => {
    const button = e.currentTarget;
    button.disabled = true; // Disable immediately to prevent multiple clicks
    const loadingToast = toast.loading("Sending OTP...");
    httpClient
      .get("event-send-otp")
      .then(({ data }) => {
        if (data.success) {
          toast.success("OTP sent successfully");
          setOtpSent(true);
          setResendTimer(120);
          toast.dismiss(loadingToast);
        } else {
          toast.dismiss(loadingToast);
          toast.error("Failed to send OTP");
          button.disabled = false; // Re-enable if sending failed
        }
      })
      .catch((err) => {
        toast.error(err.response?.data?.error || "Something went wrong");
        button.disabled = false; // Re-enable on error
      });
  };

  const handleSave = () => {
    httpClient
      .delete(`delete-category/${event._id}`)
      .then(({ data }) => {
        toast.success("Event category deleted successfully");
        setIsDelete(false);
        refetch();
      })
      .catch((err) => {
        toast.error(err.response.data.error);
      });
  };

  // Timer logic for resend button
  useEffect(() => {
    let timer;
    if (otpSent && resendTimer > 0) {
      timer = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    } else if (resendTimer === 0) {
      setOtpSent(false);
    }
    return () => clearInterval(timer);
  }, [otpSent, resendTimer]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div className="">
      <p className="mb-4">
        An OTP will be sent to your email.
        <p className="mb-4">
          <span className="block text-sm text-danger mt-1">
            This is for security reasons. The OTP will be sent to the main admin
            or the authorized person only. Deleting will remove the entire
            category along with its news.
          </span>
        </p>
      </p>

      <div className="otp-inputs mb-4">
        {otp.map((value, index) => (
          <input
            key={index}
            type="text"
            className="otp-input"
            value={value}
            onChange={(e) => handleChange(e, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            maxLength="1"
            ref={(el) => (otpRefs.current[index] = el)}
          />
        ))}
      </div>

      <div className="form-actions flex justify-between mt-5">
        <button
          type="button"
          className="btn-blue-outline"
          onClick={() => setPasswordResetUser(null)}
        >
          Cancel
        </button>
        <button
          type="button"
          className="btn-red"
          onClick={handleSendOtp}
          disabled={otpSent && resendTimer > 0}
        >
          {otpSent ? `Resend OTP (${formatTime(resendTimer)})` : "Send OTP"}
        </button>
        <button type="button" className="btn-red" onClick={handleSave}>
          Delete
        </button>
      </div>
    </div>
  );
};

export default DeleteEventCategory;
