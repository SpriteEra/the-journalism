import { Plus } from "lucide-react";
import React from "react";
import { Link } from "react-router-dom";

const AddLink = ({ to }) => {
  return (
    <Link
      className="fixed bottom-12 sm:bottom-2 right-3 sm:right-2 z-[100] 
    group
    flex items-center justify-center
    w-12 h-12
    bg-gradient-to-r from-primary to-primary
    hover:from-primary hover:to-primary-hover
   
   
    rounded-full 
    shadow-lg hover:shadow-xl
    transition-all duration-300 ease-in-out
    hover:scale-110 active:scale-95
    cursor-pointer
    border-2 border-surface/20
    backdrop-blur-sm
    before:absolute before:inset-0 
    before:rounded-full 
    before:bg-gradient-to-r before:from-surface/10 before:to-transparent
    before:opacity-0 hover:before:opacity-100
    before:transition-opacity before:duration-300
  "
      to={to}
    >
      <Plus
        className="text-paper 
      transition-transform duration-300 
      group-hover:rotate-90
      drop-shadow-sm
    "
        size={24}
      />

      {/* Ripple effect on hover */}
      <div
        className="absolute inset-0 rounded-full 
    bg-surface/20 
    scale-0 group-hover:scale-100 
    transition-transform duration-500 ease-out
    pointer-events-none
  "
      />

      {/* Pulse animation */}
      <div
        className="absolute inset-0 rounded-full 
    bg-gradient-to-r from-primary/50 to-primary/50
    animate-ping
    opacity-75
  "
      />
    </Link>
  );
};

export default AddLink;
