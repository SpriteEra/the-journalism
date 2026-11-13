import ReadHour from '../model/read.hour.model.js';

/** Show or hide all hourly read rows of one story in the analytics. */
export const setReadsLive = (type, contentId, live) =>
    ReadHour.updateMany({ type, contentId }, { $set: { live } });