import NewsList from "../../components/news/NewsList";

const ReviewNews = () => (
  <NewsList
    title="Review queue"
    description="Stories from reporters that need your approval before they go live."
    needApproval
    showCreate={false}
    editBase="/dashboard/review-news/edit-news"
    editQuery="?mode=edit&type=review"
    emptyText="Nothing is waiting for review"
  />
);
export default ReviewNews;