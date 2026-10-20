import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import toast from "react-hot-toast";
import AsyncWrapper from "../../utils/AsyncWrapper";
import { useFetchAds } from "../../hooks/ads";
import usePermission from "../../hooks/usePermission";
import Modal from "../../components/ui/Modal";
import { Button, PageHeader } from "../../components/ui";
import AdsList from "./AdsList";
import AdsUploader from "./AdsUploader";

const MAX_ADS = 5;

/** Shared page of the three ad placements: header with the create button on top (same structure as News), then the list. */
export default function AdsPage({ title, description, field, addType }) {
  const { can } = usePermission();
  const [ads, setAds] = useState([]);
  const [open, setOpen] = useState(false);
  const { isPending, data, isError, error, refetch } = useFetchAds();
  useEffect(() => { if (data?.[field]) setAds(Array.isArray(data[field]) ? data[field] : []); }, [data, field]);

  const add = () => (ads.length >= MAX_ADS ? toast.error(`You can keep at most ${MAX_ADS} ads here. Delete one first.`) : setOpen(true));
  return (
    <>
      <PageHeader title={title} description={description} actions={can("ads.manage") && <Button leftIcon={Plus} onClick={add}>Create ad</Button>} />
      <AsyncWrapper isError={isError} isPending={isPending} error={error}>
        <AdsList ads={ads} setAds={setAds} refetch={refetch} adType={addType} onAdd={add} />
      </AsyncWrapper>
      <Modal open={open} onClose={() => setOpen(false)} title={`Create ${title.toLowerCase()}`} size="xl">
        <AdsUploader addType={addType} refetch={refetch} onClose={() => setOpen(false)} />
      </Modal>
    </>
  );
}
