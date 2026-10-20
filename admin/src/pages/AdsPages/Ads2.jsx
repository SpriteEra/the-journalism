// import React, { useState } from "react";
// import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
// import { IoMdAdd } from "react-icons/io";
// import Tooltip from "../../components/common/Tooltip/Tooltip";
// import toast from "react-hot-toast";
// import ConfirmationModal from "../../components/ConfirmationModal";
// import httpClient from "../../api/httpClient"
// import { useNavigate } from "react-router-dom";

// const Ads2 = ({ setShowAdd, ads, setAds }) => {
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [selectedId, setSelectedId] = useState(null);
//   const [changeHappen, setChangeHappen] = useState(false);
//   const navigate = useNavigate();

//   const handleDelete = async (id) => {
//     const loadingToast = toast.loading("Deleting...");
//     try {
//       await httpClient.delete(`/delete-advertisement/${id}`);
//       setAds(ads.filter((ad) => ad._id !== id));
//       toast.dismiss(loadingToast);
//       toast.success("Advertisement deleted successfully");
//     } catch (err) {
//       toast.dismiss(loadingToast);
//       toast.error("Failed to delete advertisement");
//       console.log(err);
//     }
//     setIsModalOpen(false);
//   };
//   const handleEdit = (id) => {
//     navigate("?add_id=" + id);
//     setShowAdd(2);
//     // Add your edit logic here
//   };
//   const handleOnDragEnd = async (result) => {
//     if (!result.destination) return;

//     const items = Array.from(ads);
//     const [reorderedItem] = items.splice(result.source.index, 1);
//     items.splice(result.destination.index, 0, reorderedItem);
//     setAds(items);
//     setChangeHappen(true);
//   };
//   const handleOrderEdit = async (e) => {
//     // Add your API call to update the order in the backend
//     e.target.setAttribute("disabled", true);
//     try {
//       await httpClient.post("/admin/ads/update-order", { orderedAds: ads });
//       toast.success("Order Updated Successfully");
//     } catch (error) {
//       console.error("Failed to update order", error);
//     } finally {
//       () => {
//         e.target.removeAttribute("disabled");
//       };
//     }
//   };

//   const handleAdd = () => {
//     if (ads.length >= 5)
//       return toast.error("You can only add 5 Advertisement images");
//     setShowAdd(2);
//   };
//   return (
//     <>
//       <div className="bg-surface shadow-regular-shadow rounded-lg p-2 md:p-6 w-full max-w-sm">
//         <div className="flex justify-between items-center border-b border-gray pb-1">
//           <h2 className="text-xl font-semibold ">Side Advertisement Images</h2>
//           {/* <Tooltip text="Add Advertisement"> */}
//           <IoMdAdd
//             size={25}
//             className="bg-blue text-paper rounded-full"
//             onClick={handleAdd}
//           />
//           {/* </Tooltip> */}
//         </div>
//         <DragDropContext onDragEnd={handleOnDragEnd}>
//           <Droppable droppableId="ads">
//             {(provided) => (
//               <div
//                 {...provided.droppableProps}
//                 ref={provided.innerRef}
//                 className="space-y-4 mt-2"
//               >
//                 {ads.map((image, index) => (
//                   <Draggable
//                     key={image._id}
//                     draggableId={image._id}
//                     index={index}
//                   >
//                     {(provided) => (
//                       <div
//                         ref={provided.innerRef}
//                         {...provided.draggableProps}
//                         {...provided.dragHandleProps}
//                         className="flex items-center space-x-4 bg-surface-2 p-2 rounded-lg shadow-regular-shadow justify-between w-full"
//                       >
//                         <img
//                           src={image?.banner?.url}
//                           alt="Advertisement"
//                           className="w-24 h-16 object-cover rounded-lg"
//                         />
//                         <div className="">
//                           <button
//                             className="text-paper bg-blue px-3 text-xl rounded-md mr-2 py-1"
//                             onClick={() => handleEdit(image._id)}
//                           >
//                             Edit
//                           </button>
//                           <button
//                             className="text-paper bg-danger px-3 text-xl rounded-md mr-2 py-1"
//                             onClick={() => {
//                               setSelectedId(image._id);
//                               setIsModalOpen(true);
//                             }}
//                           >
//                             Delete
//                           </button>
//                         </div>
//                       </div>
//                     )}
//                   </Draggable>
//                 ))}
//                 {provided.placeholder}
//               </div>
//             )}
//           </Droppable>
//         </DragDropContext>
//         {changeHappen && (
//           <Tooltip text={"Click to Update"}>
//             <button
//               className="bg-blue text-paper rounded-md px-2 py-1 mt-2"
//               onClick={(e) => {
//                 handleOrderEdit(e);
//                 setChangeHappen(false);
//               }}
//             >
//               Update{" "}
//             </button>
//           </Tooltip>
//         )}
//       </div>
//       <ConfirmationModal
//         id={selectedId}
//         isOpen={isModalOpen}
//         onClose={() => setIsModalOpen(false)}
//         onConfirm={(e) => handleDelete(selectedId)}
//       />
//     </>
//   );
// };

// export default Ads2;

import React, { useState, useEffect } from "react";
import { Reorder } from "framer-motion";
import { Plus as IoMdAdd } from "lucide-react";
import Tooltip from "../../components/common/Tooltip/Tooltip";
import toast from "react-hot-toast";
import httpClient from "../../api/httpClient";
import { useNavigate } from "react-router-dom";
import Confirmation from "../../utils/Confirmation";

/* ---------- component ---------- */
const Ads2 = ({ setShowAdd, ads = [], setAds }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [changeHappen, setChangeHappen] = useState(false);

  /* derived state for reorder */
  const [ids, setIds] = useState([]);
  const [map, setMap] = useState({});
  const navigate = useNavigate();

  /* build id map whenever ads changes */
  useEffect(() => {
    setIds(ads.map((a) => a._id));
    const m = {};
    ads.forEach((a) => (m[a._id] = a));
    setMap(m);
  }, [ads]);

  /* ---------- CRUD ---------- */
  const handleDelete = async () => {
    const loading = toast.loading("Deleting…");
    try {
      await httpClient.delete(`/delete-ads/${selectedId}`);
      setAds(ads.filter((ad) => ad._id !== selectedId));
      toast.success("Advertisement deleted");
    } catch (e) {
      toast.error("Delete failed");
    } finally {
      toast.dismiss(loading);
      setIsModalOpen(false);
    }
  };

  const handleEdit = (id) => {
    navigate("?add_id=" + id);
    setShowAdd(2);
  };

  /* ---------- reorder ---------- */
  const handleReorder = (newIds) => {
    setIds(newIds);
    setAds(newIds.map((id) => map[id]));
    setChangeHappen(true);
  };

  const persistOrder = async (e) => {
    e.target.disabled = true;
    try {
      await httpClient.post("/ads/update-order", { orderedAds: ads });
      toast.success("Order updated");
      setChangeHappen(false);
    } catch (e) {
      toast.error("Update failed");
    } finally {
      e.target.disabled = false;
    }
  };

  /* ---------- add new ---------- */
  const handleAdd = () => {
    if (ads.length >= 5) {
      toast.error("You can only add 5 Advertisement images");
      return;
    }
    setShowAdd(2);
  };

  /* ---------- render ---------- */
  return (
    <>
      <div className="bg-surface shadow-xl rounded-lg p-2 md:p-6 w-full max-w-md min-w-32">
        <div className="flex justify-between items-center border-b border-line-strong pb-1">
          <h2 className="text-xl font-semibold">
            Side Advertisement Images
          </h2>
          <IoMdAdd
            size={25}
            className="bg-primary text-paper rounded-full cursor-pointer"
            onClick={handleAdd}
          />
        </div>

        {/* drag list */}
        {ads.length === 0 ? (
          <div className="min-h-32 flex items-center justify-center">
            <h4 className="text-lg sm:text-2xl">
              No Ads Available
            </h4>
          </div>
        ) : (
          <Reorder.Group
            axis="y"
            values={ids}
            onReorder={handleReorder}
            className="space-y-3 mt-2"
          >
            {ids.map((id) => {
              const ad = map[id];
              return (
                <Reorder.Item
                  key={id}
                  value={id}
                  className="flex items-center space-x-4 bg-surface-3 p-2 rounded-lg shadow-regular-shadow justify-between cursor-grab w-full"
                  whileDrag={{
                    scale: 1.02,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  }}
                >
                  <img
                    src={ad?.banner?.url}
                    alt="Advertisement"
                    className="w-24 h-16 object-cover rounded-lg pointer-events-none"
                  />
                  <div className="flex gap-x-2">
                    <button className="btn-blue" onClick={() => handleEdit(id)}>
                      Edit
                    </button>
                    <button
                      className="btn-red"
                      onClick={() => {
                        setSelectedId(id);
                        setIsModalOpen(true);
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </Reorder.Item>
              );
            })}
          </Reorder.Group>
        )}

        {/* persist button */}
        {changeHappen && (
          <Tooltip text="Click to update">
            <button className="btn-red mt-2" onClick={persistOrder}>
              Update
            </button>
          </Tooltip>
        )}
      </div>

      {/* confirm modal */}
      {/* <ConfirmationModal
        id={selectedId}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={() => handleDelete(selectedId)}
      /> */}
      <Confirmation
        isOpen={isModalOpen}
        id={selectedId}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleDelete}
        btnTitle="Delete"
        title="Are you sure?"
        btnDanger={true}
        description="Are you sure you want to delete this item? This action cannot be undone."
      />
    </>
  );
};

export default Ads2;
