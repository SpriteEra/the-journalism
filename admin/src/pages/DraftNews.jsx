import NewsList from "../components/news/NewsList";

const DraftNews = () =>
    <NewsList
        title="Drafts"
        description="Stories that are saved but not published yet."
        draft
        emptyText="No drafts"
        showCreate={false}
    />;
export default DraftNews;
