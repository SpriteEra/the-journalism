import React, { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { Plus as IoMdAdd } from "lucide-react";
import Tooltip from "../../components/common/Tooltip/Tooltip";
import toast from "react-hot-toast";
import ConfirmationModal from "../../components/ConfirmationModal";
import httpClient from "../../services/httpClient";
import { useNavigate } from "react-router-dom";

const SliderAds = ({ setShowAdd, ads, setAds }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [changeHappen, setChangeHappen] = useState(false);
  const navigate = useNavigate();
  const handleEdit = (id) => {
    navigate("?add_id=" + id);
    setShowAdd(1);
  };

  const handleDelete = async (id) => {
    const loadingToast = toast.loading("Deleting...");
    try {
      await httpClient.delete(`/delete-advertisement/${id}`);
      setAds(ads.filter((ad) => ad._id !== id));
      toast.dismiss(loadingToast);
      toast.success("Advertisement deleted successfully");
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error("Failed to delete advertisement");
      console.log(err);
    }
    setIsModalOpen(false);
  };
  const handleOnDragEnd = async (result) => {
    if (!result.destination) return;

    const items = Array.from(ads);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setAds(items);
    setChangeHappen(true);
  };

  const handleOrderEdit = async () => {
    // Add your API call to update the order in the backend
    try {
      await httpClient.post("/admin/ads/update-order", { orderedAds: ads });
      toast.success("Order Updated Successfully");
    } catch (error) {
      console.error("Failed to update order", error);
    }
  };

  const handleAdd = () => {
    if (ads.length >= 5)
      return toast.error("You can only add 5 Advertisement images");
    setShowAdd(1);
  };
  return (
    <>
      <div className="bg-surface shadow-regular-shadow rounded-lg p-2 md:p-6 w-full max-w-sm">
        <div className="flex justify-between items-center border-b border-gray pb-1">
          <h2 className="text-xl font-semibold ">
            Banner Advertisement Images
          </h2>
          {/* <Tooltip text="Add Advertisement"> */}
          <IoMdAdd
            size={25}
            className="bg-blue text-paper rounded-full"
            onClick={handleAdd}
          />
          {/* </Tooltip> */}
        </div>
        <DragDropContext onDragEnd={handleOnDragEnd}>
          <Droppable droppableId="ads">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-4 mt-2"
              >
                {ads.map((image, index) => (
                  <Draggable
                    key={image._id}
                    draggableId={image._id}
                    index={index}
                  >
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className="flex items-center space-x-4 bg-surface-2 p-2 rounded-lg shadow-regular-shadow justify-between w-full"
                      >
                        <img
                          src={image?.banner?.url}
                          alt="Advertisement"
                          className="w-24 h-16 object-cover rounded-lg"
                        />
                        <div className="">
                          <button
                            className="text-paper bg-blue px-3 text-xl rounded-md mr-2 py-1"
                            onClick={() => handleEdit(image._id)}
                          >
                            Edit
                          </button>
                          <button
                            className="text-paper bg-danger px-3 text-xl rounded-md mr-2 py-1"
                            onClick={() => {
                              setSelectedId(image._id);
                              setIsModalOpen(true);
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
        {changeHappen && (
          <Tooltip text={"Click to Update"}>
            <button
              className="bg-blue text-paper rounded-md px-2 py-1 mt-2"
              onClick={() => {
                handleOrderEdit();
                setChangeHappen(false);
              }}
            >
              Update{" "}
            </button>
          </Tooltip>
        )}
      </div>
      <ConfirmationModal
        id={selectedId}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={() => handleDelete(selectedId)}
      />
    </>
  );
};

export default SliderAds;
