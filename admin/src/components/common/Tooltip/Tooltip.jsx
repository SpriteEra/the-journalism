// src/Tooltip.js
import React from "react";
import "./tooltip.css";

const Tooltip = ({ text, children }) => {
  return (
    <div className="tooltip-container absolute z-1000">
      {children}
      <div className="tooltip-text">{text}</div>
    </div>
  );
};

export default Tooltip;
