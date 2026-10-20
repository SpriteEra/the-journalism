import React, { useEffect, useState } from "react";
import httpClient from "../../api/httpClient";
import AdsUploader from "./AdsUploader";
import toast from "react-hot-toast";

import { useFetchAds } from "../../hooks/ads"; // <- your custom hook
import AsyncWrapper from "../../utils/AsyncWrapper";
import Ads2 from "./Ads2";

const Ads = () => {
  const [showAdd, setShowAdd] = useState(0);

  /* -------- fetch ads ---------- */
  const { data, isPending, isError, error } = useFetchAds();

  /* `ads` state is ALWAYS an array */
  const [ads, setAds] = useState([]);

  /* when API data arrives, copy square ads into state */
  useEffect(() => {
    if (data?.square) setAds(Array.isArray(data.square) ? data.square : []);
  }, [data]);

  /* -------------------------------- */
  return (
    <div className="mx-auto p-3 bg-surface flex h-full rounded-md">
      {showAdd === 0 ? (
        <AsyncWrapper isPending={isPending} isError={isError} error={error}>
          <div className="flex flex-1 h-full items-center p-2 md:p-4 justify-evenly flex-wrap gap-x-2 gap-y-5">
            <Ads2 setShowAdd={setShowAdd} ads={ads} setAds={setAds} />
          </div>
        </AsyncWrapper>
      ) : (
        <AdsUploader showAdd={showAdd} setShowAdd={setShowAdd} />
      )}
    </div>
  );
};

export default Ads;
