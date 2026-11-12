import NewsList from "../components/news/NewsList";

const DraftNews = () =>
    <NewsList
        title="Drafts"
        description="Stories that are saved but not published yet. Rejected stories show the reviewer's reason."
        draft
        editQuery="?mode=edit&type=draft"
        emptyText="No drafts"
        showCreate={false}
    />
export default DraftNews;
