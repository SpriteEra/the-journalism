import React from "react";
import PopUp from "../utils/PopUp";
import { toast } from "react-hot-toast";
import {
  FacebookShareButton,
  WhatsappShareButton,
  TwitterShareButton,
} from "react-share";

import { Facebook as FaFacebook } from "lucide-react";

import { Copy as MdOutlineContentCopy } from "lucide-react";
import { Twitter as FaSquareXTwitter } from "lucide-react";
import { MessageCircle as RiWhatsappFill } from "lucide-react";
const NewsShare = ({ item, setIsPopUpOpen, baseurl }) => {
  const shareUrl = `${baseurl}${item?.news_id}`;
  const copyUrlToClipboard = async () => {
    // Get the current URL
    navigator.clipboard
      .writeText(shareUrl)
      .then(() => {
        toast.success("URL copied to clipboard");
        setIsPopUpOpen(false);
      })
      .catch((err) => {
        console.log("Failed to copy: ", err);
      });
  };
  return (
    <div className="flex gap-2 items-center w-full justify-between max-w-[300px] mx-auto flex-1">
      <WhatsappShareButton url={shareUrl} title={`*${item.title}*`}>
        <RiWhatsappFill
          className="text-success hover:scale-[1.2]"
          size={35}
        />
      </WhatsappShareButton>
      <FacebookShareButton
        hashtag={item.tags}
        url={shareUrl}
        title={`*${item.title}*`}
      >
        <FaFacebook size={30} className="text-blue hover:scale-[1.2]" />
      </FacebookShareButton>

      <TwitterShareButton
        url={shareUrl}
        title={`*${item.title}*`}
        hashtags={item?.tags}
      >
        <FaSquareXTwitter
          size={30}
          className="text-accent hover:scale-[1.2]"
        />
      </TwitterShareButton>
      <button onClick={copyUrlToClipboard} className="bg-gray text-paper">
        <MdOutlineContentCopy size={30} className="hover:scale-[1.2]" />
      </button>
    </div>
  );
};

const SocialShare = ({ item, baseurl }) => {
  const [isPopUpOpen, setIsPopUpOpen] = React.useState(false);

  return (
    <>
      <button
        className="bg-success text-paper px-3 py-1 rounded text-base cursor-pointer"
        onClick={() => setIsPopUpOpen(true)}
      >
        Share
      </button>
      {isPopUpOpen && (
        <PopUp
          isOpen={isPopUpOpen}
          heading="Share Link"
          classes="max-w-[450px] !max-h-[300px] !p-2"
          onClose={() => setIsPopUpOpen(false)}
        >
          <div>
            <h4 className="text-fg-subtle mb-5 text-lg">
              Click to share on social media plateform.
            </h4>
            <NewsShare
              item={item}
              baseurl={baseurl}
              setIsPopUpOpen={setIsPopUpOpen}
            />
          </div>
          <div className="w-full justify-end flex mt-5">
            <button onClick={() => setIsPopUpOpen(false)} className="btn-blue">
              Cancel
            </button>
          </div>
        </PopUp>
      )}
    </>
  );
};

export default SocialShare;
